import type { Request } from 'express';
import { injectable } from 'inversify';
import type { FilterQuery } from 'mongoose';

import { TODO_STATUS_VALUES, type ITodo, type TodoStatus } from '../model/todo-model';

export type TodoListFilters = {
    query_string?: string;
    status?: TodoStatus[];
};

type ParseFiltersResult =
    | { ok: true; listFilters: TodoListFilters }
    | { ok: false; httpStatus: number; body: Record<string, unknown> };

@injectable()
export class TodoService {

    public parseTodoFilters(req: Request): ParseFiltersResult {
        const query_string = (req.query['query_string'] as string | undefined)?.trim() || undefined;

        const rawStatus = [req.query['status']].flat().filter(Boolean) as string[];
        const invalidStatus = rawStatus.find(s => !(TODO_STATUS_VALUES as readonly string[]).includes(s));
        if (invalidStatus) {
            return {
                ok: false,
                httpStatus: 400,
                body: {
                    success: false,
                    message: `Invalid status "${invalidStatus}". Allowed: ${TODO_STATUS_VALUES.join(', ')}`,
                },
            };
        }

        return {
            ok: true,
            listFilters: {
                ...(query_string && { query_string }),
                ...(rawStatus.length > 0 && { status: rawStatus as TodoStatus[] }),
            },
        };
    }

    public buildTodoFilter(
        baseCriteria: FilterQuery<ITodo>,
        listFilters: TodoListFilters,
    ): FilterQuery<ITodo> {
        const filter: FilterQuery<ITodo> = { ...baseCriteria };

        if (listFilters.status?.length) {
            filter.status = { $in: listFilters.status };
        } else {
            // exclude deleted by default
            filter.status = { $ne: 'deleted' }; 
        }

        if (listFilters.query_string) {
            // sanitization of the query string
            const escaped = listFilters.query_string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); 
            filter.$or = [
                { title: { $regex: escaped, $options: 'i' } },
                { description: { $regex: escaped, $options: 'i' } },
            ];
        }

        return filter;
    }
}
