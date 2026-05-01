//

import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';
import { appConfig } from '../configs/app.config';
import { AuthService, IJWTPayload } from '../services/auth-service';

declare global {
    namespace Express {
        interface Request {
            session?: {
                verified_token: IJWTPayload;
                session_id: string;
            };
        }
    }
}

@injectable()
export class AuthenticationMiddleware extends BaseMiddleware {
    constructor(
        @inject(AuthService) private AuthService: AuthService,
    ){
        super();
    }

    async handler(req: Request, res: Response, next: NextFunction): Promise<Response | void> {
        try {
            const domain = appConfig.domain;
            const retoCookie = appConfig.reto_cookie;
            const actoCookie = appConfig.acto_cookie;
            const cookieOptions = appConfig.cookie_options;
            if(!retoCookie || !actoCookie) {
                return res.status(401).json({
                    success: false,
                    message: 'Unauthorized.',
                });
            }
            const accessToken =
                req.cookies?.[actoCookie] ??
                this.AuthService.extractBearerToken(req.headers.authorization ?? '');
            const sessionId = req.cookies?.[retoCookie] ?? (req.headers.session as string | undefined);
            const validationResult = await this.AuthService.validateSession({
                access_token: accessToken,
                session_id: sessionId
            });
            if (!validationResult.success) {
                const clearCookieOptions = {
                    ...cookieOptions,
                    domain: domain,
                };
                res.clearCookie(actoCookie, clearCookieOptions);
                res.clearCookie(retoCookie, clearCookieOptions);
                return res.status(validationResult.status).json({
                    success: false,
                    message: validationResult.message,
                    relogin: validationResult.relogin,
                });
            }
            const newAccessToken = validationResult.data.access_token;
            const newSessionId = validationResult.data.session_id;
            res.cookie(actoCookie, newAccessToken, {
                httpOnly: true,
                expires: appConfig.accessTokenExp,
                ...cookieOptions,
                domain: domain,
            });
            res.cookie(retoCookie, newSessionId, {
                httpOnly: true,
                expires: appConfig.refreshTokenExp,
                ...cookieOptions,
                domain: domain,
            });
            // req.cookies[actoCookie] = newAccessToken;
            // req.cookies[retoCookie] = newSessionId;
            next();
        } catch (error: unknown) {
            const message = error instanceof Error ? error.message : 'Something went wrong.';
            return res.status(500).json({
                success: false,
                message,
                error,
            });
        }
    }
}