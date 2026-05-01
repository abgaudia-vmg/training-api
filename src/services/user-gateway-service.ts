// 'injectable' is used to mark classes as able to be injected;
// 'inject' is used for injecting dependencies into class constructors
import { inject, injectable } from 'inversify';
import { UserListFilterParams, UserService } from './user-service';
import { IUser, UserModel } from '../model/user-model';

@injectable()
export class UserGatewayService {
    constructor(@inject(UserService) private readonly userService: UserService) {}

    public async getAllUser(filters?: UserListFilterParams | undefined): Promise<IUser[]> {
        const filter = this.userService.buildUserListFilter(filters ?? {});
        return UserModel.find(filter).sort({ created_at: -1 });
    }

    public async getUserById(userId: string): Promise<IUser | null> {
        return UserModel.findById(userId);
    }

    public async getUserRoleByUserId(userId: string): Promise<'admin' | 'staff' | null> {
        const user = await UserModel.findById(userId);
        if(!user) {
            return null;
        }
        return user.user_type as 'admin' | 'staff';
    }

    public async getUserByUsername(username: string): Promise<IUser | null> {
        return UserModel.findOne({ username });
    }

    public async getUserByEmail(email: string): Promise<IUser | null> {
        return UserModel.findOne({ email });
    }

    public async addUser(userData: IUser): Promise<IUser | null> {
        return UserModel.create(userData);
    }

    public async resetPassword({ username, email, password }: { username?: string; email?: string; password: string }): Promise<IUser | null> {
        const filter = username ? { username } : { email };
        return UserModel.findOneAndUpdate(filter, { password }, { new: true });
    }

    public async updateUser(userId: string, userData: IUser): Promise<IUser | null> {
        return UserModel.findByIdAndUpdate(userId, userData, { new: true });
    }

    public async deleteUser(userId: string): Promise<IUser | null> {
        return UserModel.findByIdAndDelete(userId);
    }

    public async getUserCount(): Promise<number> {
        return UserModel.countDocuments();
    }
}