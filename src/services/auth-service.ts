import { inject, injectable } from 'inversify';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

import { AuthGatewayService } from './auth-gateway-service';

import { IUser } from '../model/user-model';



@injectable()
export class AuthService {

    constructor(
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ) {

    }

    public extractBearerToken(authorizationHeader: string): string | null {
        return authorizationHeader?.split?.(' ')?.[1] || null;
    }

    public generateSessionId(): string {
        return uuidv4();
    }

    public isSessionExpired(expiration: Date): boolean {
        const expirationEpoch = new Date(expiration).getTime();
        const nowEpoch = Date.now();
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

        //@ts-ignore - TODO: fix this
        return {
            user: userData._id,
            session_id: sessionId,
            expiration: refreshTokenExp,
        };
    }

    public generateSignedJWT(tokenPayload: IJWTPayload){
        return jwt.sign(tokenPayload, process.env.jwt_secret!, { expiresIn: '15m' });
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

    public verifyJWTIgnoreExpiration(accessToken: string){
        const acto = accessToken;
        let jwtVerifyResult = null;
        try {
            jwtVerifyResult = jwt.verify(acto, process.env.jwt_secret!, { ignoreExpiration: true });
        } catch (error: any) {
            // console.error('Error verifying JWT:', error);
            return null;
        }
        return jwtVerifyResult;
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


    public async validateSession({access_token, session_id}: IValidateSessionInput): Promise<TValidationSessionResult> {

        // missing_token
        if(!access_token || !session_id) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: missing_token',
            };
        }

        // invalid_session
        const sessionEntryCurrent = await this.AuthGatewayService.getSessionEntry(session_id);
        const isSessionExpired = this.isSessionExpired(sessionEntryCurrent?.expiration as Date);
        if(isSessionExpired) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: invalid_session',
            };
        }

        //@ts-ignore - TODO: fix type
        const userData = sessionEntryCurrent?.user as IUser;
        if(!sessionEntryCurrent) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: invalid_session',
            };
        }

        // invalid_token
        const verifiedToken = this.verifyJWTIgnoreExpiration(access_token);
        if(!verifiedToken) {
            return {
                status: 401,
                success: false,
                message: 'Unauthorized: invalid_token',
            };
        }


        // session_create_failed
        const sessionEntryNew = await this.AuthGatewayService.createSessionEntry({
            //@ts-ignore - TODO: fix this
            user: sessionEntryCurrent.user?._id,
            session_id: session_id,
            expiration: new Date(),
        });
        if(!sessionEntryNew) {
            return {
                status: 500,
                success: false,
                message: 'Unauthorized: session_create_failed',
            };
        }

        // generate new access token and session
        const { generated_access_token, generated_session } = this.generateSessionAndToken({
            user_data: userData,
            refresh_token_exp: sessionEntryCurrent.expiration,
        });
        return {
            success: true,
            status: 200,
            message: 'Token is valid, session is refreshed.',
            data: {
                // verified_token: verifiedToken,
                // new_session_entry: generatedSessionPayload,
                // new_access_token: generatedAccessToken,
                verified_token: verifiedToken,
                new_session_entry: generated_session,
                new_access_token: generated_access_token,
                session_id: generated_session.session_id,

            }
        };
      
    }
}



export interface IValidateSessionInput {
    access_token: string;
    session_id: string;
}

export type TValidationSessionResult = 
  | { status: number, success: true; message: string; data: { verified_token: any; new_session_entry: ISessionPayload; new_access_token: string; session_id: string } }
  | { status: number, success: false; message: 'Unauthorized: missing_token' | 'Unauthorized: invalid_session' | 'Unauthorized: invalid_token' | 'Unauthorized: session_create_failed' };



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