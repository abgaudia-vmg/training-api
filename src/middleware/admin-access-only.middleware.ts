import { NextFunction, Request, Response } from 'express';
import { inject, injectable } from 'inversify';
import { BaseMiddleware } from 'inversify-express-utils';
import { appConfig } from '../configs/app.config';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { AuthService } from '../services/auth-service';
import { UserGatewayService } from '../services/user-gateway-service';
import { UserService } from '../services/user-service';

@injectable()
export class AdminAccessOnlyMiddleware extends BaseMiddleware {
    constructor(
        @inject(UserService) private UserService: UserService,
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(AuthService) private AuthService: AuthService,
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ){
        super();
    }

    async handler(req: Request, res: Response, next: NextFunction): Promise<any> {
        try {
            // const  actoCookie = appConfig.acto_cookie;
            const sessionId = req.cookies?.[appConfig.reto_cookie] || req.headers.session;
            const userData = await this.AuthGatewayService.getSessionEntry(sessionId);
            if(!userData) {
                return res.status(404).json({
                    success: false,
                    message: 'User not found.',
                });
            }
            const userRole = userData?.user?.user_type;
            if(userRole !== 'admin') {
                return res.status(403).json({
                    success: false,
                    message: 'Forbidden: access_denied',
                });
            }
            next();
        } catch (error: any) {
            next(error);
        }
    }
}