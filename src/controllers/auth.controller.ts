import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpGet, httpPost } from 'inversify-express-utils';
import * as yup from 'yup';
import { appConfig } from '../configs/app.config';
import { IUser } from '../model/user-model';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { AuthService } from '../services/auth-service';
import { UserGatewayService } from '../services/user-gateway-service';
import { UserService } from '../services/user-service';
import { createUserSchema, loginSchema, resetPasswordSchema } from '../validations/user.validation';

@controller('/auth')
export class AuthController {

    private domain = appConfig.domain;
    private accessTokenExp = appConfig.accessTokenExp;
    private refreshTokenExp = appConfig.refreshTokenExp;
    private cookieOptions = appConfig.cookie_options;
    private get actoCookie(): string { return appConfig.acto_cookie; }
    private get retoCookie(): string { return appConfig.reto_cookie; }

    constructor(
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(UserService) private UserService: UserService,
        @inject(AuthService) private AuthService: AuthService,
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ){}

    @httpGet('/validate')
    public async validate(req: Request, res: Response): Promise<Response> {
        try {
            const accessToken = req.cookies?.[this.actoCookie] || this.AuthService.extractBearerToken(req.headers.authorization!);
            const sessionId = req.cookies?.[this.retoCookie] || req.headers.session;
            const validationResult = await this.AuthService.validateSession({
                access_token: accessToken,
                session_id: sessionId
            });
            if(!validationResult.success) {
                return res.status(validationResult.status).json({
                    success: false,
                    message: validationResult.message,
                    relogin: validationResult.relogin,
                });
            }
            res.cookie(this.actoCookie, validationResult.data.new_access_token, {
                httpOnly: true,
                expires: this.accessTokenExp,
                ...this.cookieOptions,
                domain: this.domain,
            });
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
            const payload = await loginSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
            const { username, email, password } = payload;
            const user = username
                ? await this.UserGatewayService.getUserByUsername(username)
                : await this.UserGatewayService.getUserByEmail(email ?? '');
            if (!user) {
                return res.status(404).json({ //change to 204
                    success: false,
                    message: 'User not found.',
                    data:user,
                });
            }
            const passwordMatch = await argon2.verify(user.password, password);
            if (!passwordMatch) {
                return res.status(401).json({
                    success: false,
                    message: 'Incorrect username or password.',
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
            if (!newSessionEntry) {
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
                    session_id: generated_session.session_id,
                },
            });

        } catch (error: unknown) {
            if (error instanceof yup.ValidationError) {
                return res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.inner.map((e) => ({ field: e.path, message: e.message })),
                });
            }

            const message = error instanceof Error ? error.message : 'Something went wrong';
            return res.status(500).json({
                success: false,
                message,
                error,
            });

        }
    }
    @httpPost('/register')
    public async register(req: Request, res: Response): Promise<Response> {
        try {
            const userData = await createUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true }) as IUser;
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
            if (error instanceof yup.ValidationError) {
                return res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.inner.map((e) => ({ field: e.path, message: e.message })),
                });
            }
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
            const payload = await resetPasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

            const { username, email, password } = payload;
            const hashedPassword = await argon2.hash(password);

            const userUpdatePassword = await this.UserGatewayService.resetPassword({ username, email, password: hashedPassword });
            if (!userUpdatePassword) {
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
        } catch (error: unknown) {
            if (error instanceof yup.ValidationError) {
                return res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.inner.map((e) => ({ field: e.path, message: e.message })),
                });
            }
            const message = error instanceof Error ? error.message : 'Something went wrong';
            return res.status(500).json({
                success: false,
                message,
                error
            });
        }
    }
}