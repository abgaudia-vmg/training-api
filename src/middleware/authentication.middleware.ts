// 

import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';

import { app_config } from '../configs/app.config';
import { AuthService } from '../services/auth-service';

@injectable()
export class AuthenticationMiddleware extends BaseMiddleware {

    constructor(
        @inject(AuthService) private AuthService: AuthService,
    ){
        super();
    }


    async handler(req: Request, res: Response, next: NextFunction) {

        try {
            const domain = app_config.domain;
            const retoCookie = app_config.retoCookie;
            const actoCookie = app_config.actoCookie;

            if(!retoCookie || !actoCookie) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized.',
                });
            }

            // get access token from cookies or headers (can't test cookies for now in postman; currently using headers)
            const accessToken = req.cookies?.[actoCookie] || this.AuthService.extractBearerToken(req.headers.authorization!);
            const sessionId = req.cookies?.[retoCookie] || req.headers.session;

            const validationResult = await this.AuthService.validateSession({
                access_token: accessToken,
                session_id: sessionId
            });

            if (!validationResult.success) {
                return res.status(validationResult.status).json({
                    success: false,
                    message: validationResult.message,
                    relogin: validationResult.relogin,
                });
            }

            // set access token cookie
            res.cookie(actoCookie, validationResult.data.new_access_token, {
                httpOnly: true,
                expires: app_config.accessTokenExp,
                sameSite: 'none',
                secure: true,
                domain: domain,
            });

            // set refresh token cookie
            res.cookie(retoCookie, validationResult.data.new_session_entry.session_id, {
                httpOnly: true,
                expires: app_config.refreshTokenExp,
                sameSite: 'none',
                secure: true,
                domain: domain,
            });


            next();
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
        
    }
    
}