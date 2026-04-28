import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut } from 'inversify-express-utils';
import * as yup from 'yup';
import { AdminAccessOnlyMiddleware } from '../middleware/admin-access-only.middleware';
import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { IUser } from '../model/user-model';
import { UserGatewayService } from '../services/user-gateway-service';
import { UserService } from '../services/user-service';
import { createUserSchema, updateUserSchema } from '../validations/user.validation';

@controller('/user', AuthenticationMiddleware, AdminAccessOnlyMiddleware) // [domain]/user
export class UserController {
    constructor(
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(UserService) private UserService: UserService,
    ) { }

    @httpGet('/') // [domain]/user/
    public async getAllUser(req: Request, res: Response) {
        try {
            const allUsers = await this.UserGatewayService.getAllUser();
            return res.status(200).json({
                success: true,
                message: 'Users fetched successfully',
                data: allUsers
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong',
                error,
            });
        }
    }

    @httpGet('/:id')
    public async getUserById(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const user = await this.UserGatewayService.getUserById(userId);
            if (!user) {
                return res.status(204).json({
                    success: false,
                    message: 'User Not Found',
                });
            }
            return res.status(200).json({
                success: true,
                message: 'User Found',
                data: user || null
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong'
            });
        }
    }

    @httpPost('/')
    public async addUser(req: Request, res: Response) {
        try {
            const userData = await createUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
            const newUserData = await this.UserService.generateUserEntry({ userData: userData as IUser });
            const createdUser = await this.UserGatewayService.addUser(newUserData);
            return res.status(200).json({
                success: true,
                message: 'User Added Successfully',
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

            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Something went wrong',
                error,
            });
        }
    }

    @httpPut('/:id')
    public async updateUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const userData = await updateUserSchema.validate(req.body, { abortEarly: false, stripUnknown: true });
            const updatedUser = await this.UserGatewayService.updateUser(userId, userData as IUser);
            if (!updatedUser) {
                return res.status(204).json({
                    success: false,
                    message: 'User Not Found'
                });
            }
            return res.status(200).json({
                success: true,
                data: updatedUser,
                message: 'User Updated Successfully'
            });
        } catch (error: unknown) {
            if (error instanceof yup.ValidationError) {
                return res.status(422).json({
                    success: false,
                    message: 'Validation failed',
                    errors: error.inner.map((e) => ({ field: e.path, message: e.message })),
                });
            }
            return res.status(500).json({
                success: false,
                message: error instanceof Error ? error.message : 'Something went wrong',
            });
        }
    }

    @httpDelete('/:id')
    public async deleteUser(req: Request, res: Response) {
        try {
            const userId = req.params.id;
            const oldUserCount = await this.UserGatewayService.getUserCount();
            const deletedUser = await this.UserGatewayService.deleteUser(userId);
            const newUserCount = await this.UserGatewayService.getUserCount();
            if (!deletedUser) {
                return res.status(204).json({
                    success: false,
                    message: 'User Not Found, delete action failed',
                });
            }
            const updateUsers = await this.UserGatewayService.getAllUser();
            return res.status(200).json({
                success: true,
                message: 'User Deleted Successfully',
                oldUserCount: oldUserCount,
                newUserCount: newUserCount,
                data: updateUsers,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong',
                error,
            });
        }
    }
}