import type { Request } from 'express';
import type { FilterQuery } from 'mongoose';

import { TODO_STATUS_VALUES, type ITodo, type TodoStatus } from '../../model/todo-model';

export type TodoListFilters = {
    query_string?: string;
    status?: TodoStatus;
};

function escapeRegexForLiteralMatch(literal: string): string {
    return literal.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export function buildTodoListFilter(
    baseMongoCriteria: FilterQuery<ITodo>,
    listFilters?: TodoListFilters,
): FilterQuery<ITodo> {
    const mongoFilter: FilterQuery<ITodo> = { ...baseMongoCriteria };
    if (listFilters?.status) {
        mongoFilter.status = listFilters.status;
    }
    const trimmedSearchInput = listFilters?.query_string?.trim();
    if (trimmedSearchInput) {
        const escapedSearchPattern = escapeRegexForLiteralMatch(trimmedSearchInput);
        mongoFilter.$or = [
            { title: { $regex: escapedSearchPattern, $options: 'i' } },
            { description: { $regex: escapedSearchPattern, $options: 'i' } },
        ];
    }
    return mongoFilter;
}

export function firstQueryParam(rawQueryInput: unknown): string | undefined {
    if (typeof rawQueryInput === 'string') {
        return rawQueryInput;
    }
    if (Array.isArray(rawQueryInput) && typeof rawQueryInput[0] === 'string') {
        return rawQueryInput[0];
    }
    return undefined;
}

export function parseTodoListFilters(
    req: Request,
): { ok: true; listFilters?: TodoListFilters } | { ok: false; httpStatus: number; body: Record<string, unknown> } {
    const trimmedQueryString = firstQueryParam(req.query['query_string'])?.trim();
    const searchQuery =
        trimmedQueryString !== undefined && trimmedQueryString.length > 0 ? trimmedQueryString : undefined;

    const trimmedStatusParam = firstQueryParam(req.query['status'])?.trim() ?? '';
    let todoStatusFilter: TodoStatus | undefined;
    if (trimmedStatusParam.length > 0) {
        if (!(TODO_STATUS_VALUES as readonly string[]).includes(trimmedStatusParam)) {
            return {
                ok: false,
                httpStatus: 400,
                body: {
                    success: false,
                    message: `Invalid status. Allowed values: ${TODO_STATUS_VALUES.join(', ')}`,
                },
            };
        }
        todoStatusFilter = trimmedStatusParam as TodoStatus;
    }

    const listFilters: TodoListFilters = {};
    if (searchQuery) {
        listFilters.query_string = searchQuery;
    }
    if (todoStatusFilter) {
        listFilters.status = todoStatusFilter;
    }
    const hasAnyListFilter: boolean = searchQuery !== undefined || todoStatusFilter !== undefined;
    return { ok: true, listFilters: hasAnyListFilter ? listFilters : undefined };
}
