import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut } from 'inversify-express-utils';
import * as yup from 'yup';
import { appConfig } from '../configs/app.config';
import { AdminAccessOnlyMiddleware } from '../middleware/admin-access-only.middleware';
import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { ITodo } from '../model/todo-model';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { TodoGatewayService } from '../services/todo-gateway-service';
import { TodoService } from '../services/todo-service';
import { UserGatewayService } from '../services/user-gateway-service';
import { createTodoSchema, updateTodoSchema } from '../validations/todo.validation';

@controller('/todo', AuthenticationMiddleware)
export class TodoController {

    constructor(
        @inject(TodoGatewayService) private TodoGatewayService: TodoGatewayService,
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(TodoService) private todoService: TodoService,
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ) { }

    @httpGet('/', AdminAccessOnlyMiddleware)
    public async getAll(req: Request, res: Response) {
        try {
            const listFilterResult = this.todoService.parseTodoFilters(req);
            if (!listFilterResult.ok) {
                return res.status(listFilterResult.httpStatus).json(listFilterResult.body);
            }

            const todos = await this.TodoGatewayService.getAllTodo(listFilterResult.listFilters);
            return res.status(200).json({
                success: true,
                message: 'Todos fetched successfully',
                data: todos ?? [],
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

    @httpGet('/all-per-user/:userId', AdminAccessOnlyMiddleware)
    public async getAllTodoPerUser(req: Request, res: Response) {
        try {
            const userId = req.params.userId?.trim();
            if (!userId) {
                return res.status(400).json({
                    success: false,
                    message: 'userId path parameter is required',
                });
            }
            const listFilterResult = this.todoService.parseTodoFilters(req);
            if (!listFilterResult.ok) {
                return res.status(listFilterResult.httpStatus).json(listFilterResult.body);
            }
            const todosForUser = await this.TodoGatewayService.getAllTodoPerUser(userId, listFilterResult.listFilters);
            return res.status(200).json({
                success: true,
                message: 'Todos fetched successfully',
                data: todosForUser ?? [],
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

    @httpGet('/my-todos')
    public async getAllMyTodos(req: Request, res: Response) {
        try {
            const sessionId = req.cookies?.[appConfig.acto_cookie] || req.headers.session;
            const userData = await this.AuthGatewayService.getSessionEntry(sessionId);
            const userId = userData?.user?._id;
            const listFilterResult = this.todoService.parseTodoFilters(req);
            if (!listFilterResult.ok) {
                return res.status(listFilterResult.httpStatus).json(listFilterResult.body);
            }
            const todosForUser = await this.TodoGatewayService.getAllTodoPerUser(userId, listFilterResult.listFilters);
            return res.status(200).json({
                success: true,
                message: 'Todos fetched successfully',
                data: todosForUser ?? [],
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

    @httpGet('/:id')
    public async getTodoById(req: Request, res: Response) {
        try{

            const todoId = req.params.id;
            const todo = await this.TodoGatewayService.getTodoById(todoId);
            if(!todo) {
                return res.status(404).json({
                    success: false,
                    message: 'No todo with this id found.',
                    todo_id: todoId,
                });
            }

            return res.status(200).json({
                success: true,
                message: 'Todo with id found.',
                data: todo,
            });

        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

    @httpPost('/')
    public async createTodo(req: Request, res: Response) {
        try{
            const todoData = await createTodoSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

            // get the user data from the session
            const sessionId = req.cookies?.[appConfig.acto_cookie] || req.headers.session;
            const userData = await this.AuthGatewayService.getSessionEntry(sessionId);
            const userId = userData?.user?._id;
            const userRole = userData?.user?.user_type;

            const enrichedTodoData: Partial<ITodo> = { ...todoData, created_by: userId };

            if(userRole === 'staff') {
                enrichedTodoData.assigned_to = userId;
            }

            if(!enrichedTodoData.assigned_to) {
                return res.status(400).json({
                    success: false,
                    payload: enrichedTodoData,
                    message: 'Unable to create todo, no user assigned to the todo.',
                });
            }

            const todo = await this.TodoGatewayService.createTodo(enrichedTodoData as ITodo);

            return res.status(200).json({
                success: true,
                message: 'Todo created successfully',
                data: todo,
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
                message: error instanceof Error ? error.message : 'Something went wrong.',
                error,
            });
        }
    }

    @httpPut('/:id')
    public async updateTodo(req: Request, res: Response) {
        try{
            const todoId = req.params.id;

            // stripUnknown removes created_by, created_at, updated_at automatically
            const todoData = await updateTodoSchema.validate(req.body, { abortEarly: false, stripUnknown: true });

            const updatedTodo = await this.TodoGatewayService.updateTodo({ todo_id: todoId, todo_data: todoData as ITodo });
            return res.status(200).json({
                success: true,
                message: 'Todo updated successfully',
                data: updatedTodo,
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
                message: error instanceof Error ? error.message : 'Something went wrong.',
                error,
            });
        }
    }

    @httpDelete('/:id')
    public async deleteTodo(req: Request, res: Response) {
        try{
            const todoId = req.params.id;
            const deletedTodo = await this.TodoGatewayService.softDeleteTodo(todoId);
            return res.status(200).json({
                success: true,
                message: 'Todo deleted successfully',
                data: deletedTodo,
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

}