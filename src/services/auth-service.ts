import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { AuthGatewayService } from './auth-gateway-service';
import { appConfig } from '../configs/app.config';
import { IUser } from '../model/user-model';

@injectable()
export class AuthService {

    constructor(
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ) {}

    public extractBearerToken(authorizationHeader: string): string | null {
        return authorizationHeader?.split?.(' ')?.[1] || null;
    }

    public generateSessionId(): string {
        return uuidv4();
    }

    public isSessionExpired(expiration: Date): boolean {
        const expirationEpoch = new Date(expiration).getTime();
        const nowEpoch = appConfig.getCurrentDate.getTime();
        return expirationEpoch < nowEpoch;
    }

    public generateTokenPayload(userData: IUser): IJWTPayload {
        return {
            user_id: userData._id,
            email: userData.email,
            complete_name: `${userData.first_name} ${userData.last_name}`,
            role: userData.user_type
        };
    }

    public generateSessionPayload({
        userData,
        sessionId,
        refreshTokenExp,
    }: {
        userData: IUser,
        sessionId: string,
        refreshTokenExp: Date
    }): ISessionPayload {
        return {
            user: userData._id,
            session_id: sessionId,
            expiration: refreshTokenExp,
        };
    }

    public generateSignedJWT(tokenPayload: IJWTPayload){
        return jwt.sign(tokenPayload, process.env.jwt_secret!, { expiresIn: appConfig.jwt_expiry });
    }

    public verifyJWT(accessToken: string){
        const acto = accessToken;
        let jwtVerifyResult = null;
        try {
            jwtVerifyResult = jwt.verify(acto, process.env.jwt_secret!);
        } catch (error: any) {
            // console.error('Error verifying JWT:', error);
            return null;
        }
        return jwtVerifyResult;
    }

    public verifyJWTv2(accessToken: string): Partial<IJWTPayload> & { is_expired?: boolean; is_invalid?: boolean } {
        const acto = accessToken;
        const secret = process.env?.jwt_secret ?? '';

        try {
            const jwtVerifyResult = jwt.verify(acto, secret, {ignoreExpiration: true });
            if (!jwtVerifyResult || typeof jwtVerifyResult === 'string') {
                return { is_expired: true };
            }
            const payload = jwtVerifyResult as IJWTPayload;
            return { ...payload, is_expired: false };
        } catch(error: any) {
            if(error.message === 'invalid token') {
                return { is_invalid: true };
            }

            if(error.message === 'jwt expired') {
                return { is_expired: true };
            }
            console.error('Error verifying JWT:', error.message);
            return { is_invalid: true, is_expired: true };
        }
    }

    public generateSessionAndToken ({
        user_data: userData,
        refresh_token_exp: refreshTokenExp,
    }: {
        user_data: IUser,
        refresh_token_exp: Date,
    }):
        {
            generated_access_token: string,
            generated_session: ISessionPayload,
        } {

        const tokenPayload = this.generateTokenPayload(userData);
        const generatedActo = this.generateSignedJWT(tokenPayload);
        const sessionId = this.generateSessionId();
        const generatedSessionPayload = this.generateSessionPayload({
            userData,
            sessionId,
            refreshTokenExp,
        });

        return {
            generated_access_token: generatedActo,
            generated_session: generatedSessionPayload,
        };
    }

    public async validateSession({access_token, session_id, returnJWTContent}: IValidateSessionInput): Promise<TValidationSessionResult> {

        // GUARD CLAUSE: NO TOKEN OR SESSION ID
        if(!session_id || !access_token) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: missing_token(s)',
                relogin: true,
            };
        }

        const sessionEntryCurrent = await this.AuthGatewayService.getSessionEntry(session_id);
        // GUARD CLAUSE: NO SESSION ENTRY
        if(!sessionEntryCurrent) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: invalid_session',
                relogin: true,
            };
        }

        const expiration = sessionEntryCurrent.expiration;
        const isSessionExpired = !expiration || this.isSessionExpired(expiration);
        // GUARD CLAUSE: SESSION EXPIRED
        if (isSessionExpired) {
            return {
                is_expired: isSessionExpired,
                status: 401,
                success: false,
                message: 'Unauthorized: session_expired',
                relogin: true,
            };
        }

        const userData = sessionEntryCurrent.user as IUser;
        const actoStatus = this.verifyJWTv2(access_token);

        // GUARD CLAUSE: INVALID TOKEN
        if(actoStatus.is_invalid) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: token_compromised',
                relogin: true,
            };
        }

        // CASE: TOKEN EXPIRED
        if(actoStatus.is_expired) {
            const newAccessToken = this.generateSignedJWT({
                user_id: userData._id,
                email: userData.email,
                complete_name: `${userData.first_name} ${userData.last_name}`,
                role: userData.user_type,
            });
            return {
                status: 200,
                success: true,
                message: 'Token is valid, session is refreshed.',
                data: {
                    session_id: session_id,
                    is_expired: isSessionExpired,
                    verified_token: actoStatus,
                    access_token: newAccessToken,
                    session_entry: sessionEntryCurrent,
                },
            };
        }

        // const { generated_access_token, generated_session } = this.generateSessionAndToken({
        //     user_data: userData,
        //     refresh_token_exp: appConfig.refreshTokenExp,
        // });

        //Force Expire Current Session
        // await this.AuthGatewayService.updateSessionEntryBySessionId(session_id, {
        //     expiration: appConfig.getCurrentDate,
        // });

        // Create New Session
        // const updated = await this.AuthGatewayService.createSessionEntry(generated_session);
        // if(!updated) {
        //     return {
        //         status: 500,
        //         success: false,
        //         message: 'Unauthorized: session_create_failed',
        //         relogin: true,
        //     };
        // }

        return {
            success: true,
            status: 200,
            message: 'Token is valid, session is refreshed.',
            data: {
                session_id: session_id,
                is_expired: isSessionExpired,
                verified_token: actoStatus,
                session_entry: sessionEntryCurrent,
                access_token: access_token,
                // session_entry: generated_session || sessionEntryCurrent,
                // access_token: generated_access_token || access_token,
                // session_id: generated_session?.session_id || session_id,
                // session_entry: sessionEntryCurrent,
                // access_token: generated_access_token || access_token,
                // session_id: generated_session?.session_id || session_id,

            }
        };

    }
}

export interface IValidateSessionInput {
    access_token: string;
    session_id: string;
    returnJWTContent?: boolean;
}

export type TValidationSessionResult =
  | {
      status: number;
      success: true;
      message: string;
      data: {
          is_expired?: boolean;
          is_invalid?: boolean;
          verified_token: any;
          session_entry?: ISessionPayload;
          access_token?: string;
          session_id: string;
      };
  }
  | {
      status: number;
      success: false;
      is_expired?: boolean;
      message:
        | 'Unauthorized: missing_token(s)'
        | 'Unauthorized: invalid_session'
        | 'Unauthorized: acto_expired'
        | 'Unauthorized: token_compromised'
        | 'Unauthorized: session_create_failed'
        | 'Unauthorized: session_expired';
      relogin?: boolean;
  };

export interface ISessionPayload {
    user: any;
    session_id: string;
    expiration: Date;
}

export interface IJWTPayload {
    user_id: any;
    email: string;
    complete_name: string;
    role: string;
}

export interface ISignedJWT {
    payload: any;
    secret: string;
    expiresIn: string;
}