import * as argon2 from 'argon2';
import { injectable } from 'inversify';
import { FilterQuery, Types } from 'mongoose';
import * as yup from 'yup';
import { appConfig } from '../configs/app.config';
import { IUser } from '../model/user-model';

export type UserListUserType = IUser['user_type'];

export interface UserListFilterParams {
    query_string?: string | undefined;
    user_type?: UserListUserType | undefined;
}

export const userListQuerySchema = yup.object({
    query_string: yup.string().optional(),
    user_type: yup.string().oneOf(['staff', 'admin'] as const).optional(),
});

export function firstQueryString(value: unknown): string | undefined {
    if (typeof value === 'string') {
        return value === '' ? undefined : value;
    }
    if (Array.isArray(value) && typeof value[0] === 'string') {
        return value[0] === '' ? undefined : value[0];
    }
    return undefined;
}

@injectable()
export class UserService {

    public generateUsername({
        first_name,
        last_name,
        domain=appConfig.domain_email
    }: {
        first_name: string;
        last_name: string;
        domain?: string;
    }) {
        const last_name_lowercase = last_name?.toLowerCase();
        const first_name_lowercase = first_name?.toLowerCase();
        const firstNameTrimmed = first_name_lowercase?.trim();
        const firstNameJoined = firstNameTrimmed?.split(' ')?.join('');
        const firstThreeLettersFname = firstNameJoined?.substring(0, 3).toLowerCase();
        const finalUsername = `${firstThreeLettersFname}${last_name_lowercase}@${domain}`;
        return finalUsername;
    }

    public async generateUserEntry({
        userData
    }: {
        userData: IUser;
    }): Promise<IUser> {
        const newUserData = { ...userData };
        const passwordHashed = await argon2.hash(newUserData.password);
        newUserData.password = passwordHashed;
        return newUserData as IUser;
    }

    /**
     * Builds a Mongo filter for listing users. Optional `query_string` matches
     * username, email, first_name, last_name, user_type, or a valid `_id`.
     * Optional `user_type` restricts to that role. Omit both for no extra criteria.
     */
    public buildUserListFilter(params: UserListFilterParams): FilterQuery<IUser> {
        const filter: FilterQuery<IUser> = {};
        const userType = params.user_type;
        if (userType !== undefined) {
            filter.user_type = userType;
        }

        const trimmedQuery = params.query_string?.trim();
        if (trimmedQuery === undefined || trimmedQuery === '') {
            return filter;
        }

        const escaped = trimmedQuery.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        const regex = new RegExp(escaped, 'i');
        const orConditions: FilterQuery<IUser>[] = [
            { username: regex },
            { email: regex },
            { first_name: regex },
            { last_name: regex },
            { user_type: regex },
        ];
        if (Types.ObjectId.isValid(trimmedQuery) && new Types.ObjectId(trimmedQuery).toString() === trimmedQuery) {
            orConditions.unshift({ _id: new Types.ObjectId(trimmedQuery) });
        }

        filter.$or = orConditions;
        return filter;
    }
}