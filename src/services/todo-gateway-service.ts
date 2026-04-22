import { inject, injectable } from 'inversify';

import { TodoService, type TodoListFilters } from './todo-service';

import { ITodo, TodoModel } from '../model/todo-model';

@injectable()
export class TodoGatewayService {

    constructor(@inject(TodoService) private todoService: TodoService) {}

    public async getAllTodo(listFilters?: TodoListFilters): Promise<ITodo[]> {
        const mongoFilter = this.todoService.buildTodoFilter({}, listFilters ?? {});
        return TodoModel.find(mongoFilter).sort({ created_at: -1 }).populate('created_by').populate('assigned_to');
    }
    public async getAllTodoPerUser(userId: string, listFilters?: TodoListFilters): Promise<ITodo[]> {
        const mongoFilter = this.todoService.buildTodoFilter({ assigned_to: userId }, listFilters ?? {});
        return TodoModel.find(mongoFilter).sort({ created_at: -1 }).populate('created_by').populate('assigned_to');
    }
    public async getTodoById(todoId: string): Promise<ITodo | null>{
        return TodoModel.findById(todoId).sort({ created_at: -1 });
    }
    // public async getOneTodoByUserId(userId: string): Promise<ITodo[]> {} 
    public async createTodo(todoData: ITodo): Promise<ITodo> {
        return TodoModel.create(todoData);
    }
    public async updateTodo({ todo_id, todo_data }: { todo_id: string, todo_data: ITodo }): Promise<ITodo | null> {
        return TodoModel.findByIdAndUpdate(todo_id, todo_data, { new: true });
    }
    public async softDeleteTodo(todoId: string): Promise<ITodo | null> {
        return TodoModel.findByIdAndUpdate(
            todoId,
            {
                $set: {
                    deleted_at: new Date(),
                    updated_at: new Date(),
                    status: 'deleted',
                },
            },
            { new: true },
        );
    }
}
