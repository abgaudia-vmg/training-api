import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';

import { app_config } from '../configs/app.config';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { AuthService } from '../services/auth-service';
import { UserGatewayService } from '../services/user-gateway-service';
import { UserService } from '../services/user-service';

@controller('/auth')
export class AuthController {

    private domain = app_config.domain;
    private accessTokenExp = app_config.accessTokenExp;
    private refreshTokenExp = app_config.refreshTokenExp;
    private cookieOptions = app_config.cookieOptions;
    private get actoCookie(): string { return app_config.actoCookie; }
    private get retoCookie(): string { return app_config.retoCookie; }

    constructor(
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(UserService) private UserService: UserService,
        @inject(AuthService) private AuthService: AuthService,
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ){}
    
    // @httpGet('/validate')
    // public async validate(req: Request, res: Response): Promise<Response> {
    //     try { 

    //         // get access token from cookies or headers (can't test cookies for now in postman; currently using headers)
    //         const accessToken = req.cookies?.[this.actoCookie] || this.AuthService.extractBearerToken(req.headers.authorization!);
    //         const sessionId = req.cookies?.[this.retoCookie] || req.headers.session;
    //         if(!accessToken || !sessionId) {
    //             return res.status(401).json({
    //                 success:false,
    //                 message: 'Unauthorized.',
    //             });
    //         }

    //         //look-up session entry in database
    //         const sessionEntryCurrent = await this.AuthGatewayService.getSessionEntry(sessionId!);
    //         if(!sessionEntryCurrent) {
    //             return res.status(401).json({
    //                 success:false,
    //                 message: 'Unauthorized.',
    //             });
    //         }


    //         // verify access token
    //         // const verifiedToken = jwt.verify(accessToken!, process.env.jwt_secret!);
    //         const verifiedToken = this.AuthService.verifyJWT(accessToken!);
    //         if(!verifiedToken) {
    //             return res.status(401).json({
    //                 success:false,
    //                 message: 'Unauthorized.',
    //             });
    //         }


    //         // generate new access token and session
    //         const { generated_access_token, generated_session } = this.AuthService.generateSessionAndToken({
    //             //@ts-ignore - TODO: fix this
    //             user_data: sessionEntryCurrent.user,
    //             refresh_token_exp: sessionEntryCurrent.expiration,
    //         });

            
    //         // set access token cookie
    //         res.cookie(this.actoCookie, generated_access_token, {
    //             httpOnly: true,
    //             expires: this.accessTokenExp,
    //             sameSite: 'none',
    //             secure: true,
    //             domain: this.domain,
    //         });

    //         // set refresh token cookie
    //         res.cookie(this.retoCookie, generated_session.session_id, {
    //             httpOnly: true,
    //             expires: this.refreshTokenExp,
    //             sameSite: 'none',
    //             secure: true,
    //             domain: this.domain,
    //         });


    //         // create session entry in database
    //         const sessionEntryNew = await this.AuthGatewayService.createSessionEntry(generated_session);

    //         if(!sessionEntryNew) {
    //             return res.status(500).json({
    //                 success: false,
    //                 message: 'Failed to create session entry.',
    //             });
    //         }

    //         return res.status(200).json({
    //             success:true,
    //             message: 'Session is valid.',
    //             data: {
    //                 verified_token: verifiedToken,
    //                 session_entry: sessionEntryNew,
    //                 access_token: generated_access_token,
    //                 session_id: generated_session.session_id,
    //             },
    //         });

    //     } catch (error: any){
    //         return res.status(500).json({
    //             success:false,
    //             message: error?.message || 'Something went wrong.',
    //             full_error: error
    //         });
    //     }
    // }
    @httpGet('/validate')
    public async validate(req: Request, res: Response): Promise<Response> {
        try { 

            // get access token from cookies or headers (can't test cookies for now in postman; currently using headers)
            const accessToken = req.cookies?.[this.actoCookie] || this.AuthService.extractBearerToken(req.headers.authorization!);
            const sessionId = req.cookies?.[this.retoCookie] || req.headers.session;
           
            console.log('actoCookie', req.cookies );
            
            const validationResult = await this.AuthService.validateSession({
                access_token: accessToken,
                session_id: sessionId
            });

            if(!validationResult.success) {
                return res.status(validationResult.status).json({
                    success: false,
                    message: validationResult.message,
                });
            }

           
            // set access token cookie
            res.cookie(this.actoCookie, validationResult.data.new_access_token, {
                httpOnly: true,
                expires: this.accessTokenExp,
                ...this.cookieOptions,
                domain: this.domain,
            });

            // set refresh token cookie
            res.cookie(this.retoCookie, validationResult.data.new_session_entry.session_id, {
                httpOnly: true,
                expires: this.refreshTokenExp,
                ...this.cookieOptions,
                domain: this.domain,
            });


            return res.status(200).json({
                success:true,
                message: validationResult.message || 'Session is valid.',
                data: {
                    verified_token: validationResult.data.verified_token,
                    session_entry: validationResult.data.new_session_entry,
                    access_token: validationResult.data.new_access_token,
                    session_id: validationResult.data.new_session_entry.session_id,
                },
            });

        } catch (error: any){
            return res.status(500).json({
                success:false,
                message: error?.message || 'Something went wrong.',
                error
            });
        }
    }

    @httpPost('/logout')
    public logout(req: Request, res: Response): any {
        try {
            res.clearCookie(this.actoCookie);
            res.clearCookie(this.retoCookie);
            return res.status(200).json({
                success: true,
                message: 'User logged out.',
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error
            });
        }
    }


    @httpPost('/login')
    public async login(req: Request, res: Response): Promise<any> {
        try {

            if(!req.body || (!req.body.email && !req.body.username) || !req.body.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to login, no email or username or password provided.',
                });
            }

            const payload = req.body;
            const username = payload?.username as string;
            const email = payload?.email as string;
            const password = payload?.password as string;
            let user = null;
            if(username) {
                user = await this.UserGatewayService.getUserByUsername(username);
            } 
            
            if(email) {
                user = await this.UserGatewayService.getUserByEmail(email);
            }

            if(!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.',
                    data:user,
                });
            }

            if(!user) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.',
                    data:user,
                });
            }
            const passwordMatch = await argon2.verify(user.password, password);
            if(!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Incorrect username or password.',
                });
            }

            const jwtSecret = process.env.jwt_secret ?? process.env.JWT_SECRET;
            if (!jwtSecret) {
                return res.status(500).json({
                    success: false,
                    message: 'Server configuration error: JWT secret is not set.',
                });
            }

            const { generated_access_token, generated_session } = this.AuthService.generateSessionAndToken({
                user_data: user,
                refresh_token_exp: this.refreshTokenExp,
            });

            
            res.cookie(this.actoCookie, generated_access_token, {
                httpOnly: true,
                expires: this.accessTokenExp,
                ...this.cookieOptions,
                domain: this.domain,
            });

            res.cookie(this.retoCookie, generated_session.session_id, {
                httpOnly: true,
                expires: this.refreshTokenExp,
                ...this.cookieOptions,
                domain: this.domain,
            });


            const newSessionEntry = await this.AuthGatewayService.createSessionEntry(generated_session);
            if(!newSessionEntry) {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to create session entry.',
                });
            }

            
            return res.status(200).json({
                success: true,
                message: 'Login successful.',
                data: {
                    session_entry: newSessionEntry,
                    access_token: generated_access_token,
                    // refresh_token: sessionPayload.sessionId,
                    session_id: generated_session.session_id,
                }
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message ?? 'Something went wrong.',
                payload: req.body,
            });
        }
    }

    @httpPost('/register')
    public async register(req: Request, res: Response): Promise<Response> {
        try {
            const userData = req.body;
            if (!userData) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to register, no data received',
                });
            }

            const newUserData = await this.UserService.generateUserEntry({ userData });
            const createdUser = await this.UserGatewayService.addUser(newUserData);

            return res.status(200).json({
                success: true,
                message: 'User registered successfully',
                data: createdUser,
            });
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Something went wrong';
            return res.status(500).json({
                success: false,
                message,
            });
        }
    }

    @httpPost('/reset-password')
    public async resetPassword(req: Request, res: Response): Promise<any> {
        try {

            if(!req.body || !req.body.username || !req.body.password) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to reset password, no username or password provided.',
                });
            }
            // only require password and username
            const payload = req.body;
            const username = payload?.username as string;
            const password = payload?.password as string;
            const hashedPassword = await argon2.hash(password);

            const userUpdatePassword = await this.UserGatewayService.resetPassword({username, password: hashedPassword});
            if(!userUpdatePassword) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to reset password.',
                });
            }
            
            return res.status(200).json({
                success: true,
                message: 'Password reset successful.',
                data: userUpdatePassword,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }
}