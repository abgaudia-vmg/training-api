// 'injectable' is used to mark classes as able to be injected; 
// 'inject' is used for injecting dependencies into class constructors
import { injectable } from 'inversify';

import { AuthModel, IAuth } from '../model/auth-model';
import { IUser } from '../model/user-model';
// import { UserModel, IUser } from


@injectable()
export class AuthGatewayService {
    public async getSessionEntry(reto: string): Promise<IAuth & { user: IUser } | null> {
        return AuthModel.findOne({
            session_id: reto,
        }).populate({
            path: 'user',
        });
    }

    public async createSessionEntry(auth: any): Promise<IAuth> {
        return AuthModel.create(auth);
    }
}
