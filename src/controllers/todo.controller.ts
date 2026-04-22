import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut } from 'inversify-express-utils';

import { app_config } from '../configs/app.config';
import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { ITodo } from '../model/todo-model';
import { AuthGatewayService } from '../services/auth-gateway-service';
import { TodoGatewayService } from '../services/todo-gateway-service';
import { TodoService } from '../services/todo-service';
import { UserGatewayService } from '../services/user-gateway-service';

@controller('/todo', AuthenticationMiddleware)
export class TodoController {

    constructor(
        @inject(TodoGatewayService) private TodoGatewayService: TodoGatewayService,
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(TodoService) private todoService: TodoService,
        @inject(AuthGatewayService) private AuthGatewayService: AuthGatewayService,
    ) { }


    @httpGet('/')
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
    
    @httpGet('/all-per-user/:userId')
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


            // get the user data from the session
            const sessionId = req.cookies?.[app_config.actoCookie] || req.headers.session;
            const userData = await this.AuthGatewayService.getSessionEntry(sessionId);
            const userId = userData?.user?._id;
            const userRole = userData?.user?.user_type;


            const todoData = req.body;
            if(!todoData) {
                return res.status(400).json({
                    success: false,
                    payload: todoData,
                    message: 'Failed to create todo, no data received',
                });
            }
            

            // set the created by field to the user id
            todoData.created_by = userId;

            // if the user is a staff, automatically assign the todo to the user
            if(userRole === 'staff') {
                todoData.assigned_to = userId;
            }

      
            // if(!todoData.assigned_to) {
            //     return res.status(400).json({
            //         success:false,
            //         payload: todoData,
            //         message: 'Unable to create todo, no user assigned to the todo.'
            //     });
            // }


            const todo = await this.TodoGatewayService.createTodo(todoData);
      

            return res.status(200).json({
                success: true,
                message: 'Todo created successfullysss',
                data: todo,
                userRole
            });
        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
                error,
            });
        }
    }

    @httpPut('/:id')
    public async updateTodo(req: Request, res: Response) {
        try{
            const todoId = req.params.id;
            const todoData = req.body as Partial<ITodo>;
            if(!todoId || !todoData) {
                return res.status(400).json({
                    success: false,
                    message: 'Failed to update todo, no data received',
                    payload: todoData,
                });
            }


            //exclude from updates
            delete todoData.created_by;
            delete todoData.created_at;


            const updatedTodo = await this.TodoGatewayService.updateTodo({todo_id: todoId, todo_data: todoData as ITodo });
            return res.status(200).json({
                success: true,
                message: 'Todo updated successfully',
                data: updatedTodo, 
            });


        } catch (error: any) {
            return res.status(500).json({
                success: false,
                message: error?.message || 'Something went wrong.',
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