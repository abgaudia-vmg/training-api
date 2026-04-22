import { Request, Response } from 'express';
import { inject } from 'inversify';
import { controller, httpDelete, httpGet, httpPost, httpPut } from 'inversify-express-utils';

import { AuthenticationMiddleware } from '../middleware/authentication.middleware';
import { TodoGatewayService } from '../services/todo-gateway-service';
import { TodoService } from '../services/todo-service';
import { UserGatewayService } from '../services/user-gateway-service';

@controller('/todo', AuthenticationMiddleware)
export class TodoController {

    constructor(
        @inject(TodoGatewayService) private TodoGatewayService: TodoGatewayService,
        @inject(UserGatewayService) private UserGatewayService: UserGatewayService,
        @inject(TodoService) private todoService: TodoService,
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

            const todoData = req.body;
            if(!todoData) {
                return res.status(400).json({
                    success: false,
                    payload: todoData,
                    message: 'Failed to create todo, no data received',
                });
            }
            
            if(!todoData.assigned_to) {
                return res.status(400).json({
                    success:false,
                    payload: todoData,
                    message: 'Unable to create todo, no user assigned to the todo.'
                });
            }
            const todo = await this.TodoGatewayService.createTodo(todoData);
      

            return res.status(200).json({
                success: true,
                message: 'Todo created successfullysss',
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

    @httpPut('/:id')
    public async updateTodo(req: Request, res: Response) {
        try{
            const todoId = req.params.id;
            const todoData = req.body;
            if(!todoId || !todoData) {

                return res.status(400).json({
                    success: false,
                    message: 'Failed to update todo, no data received',
                    payload: todoData,
                });
            }


            const updatedTodo = await this.TodoGatewayService.updateTodo({todo_id: todoId, todo_data: todoData });
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