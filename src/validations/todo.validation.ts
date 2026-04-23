import * as yup from 'yup';

import { TODO_STATUS_VALUES } from '../model/todo-model';

export const createTodoSchema = yup.object({
    title: yup
        .string()
        .trim()
        .required('Title is required'),
    description: yup
        .string()
        .trim()
        .required('Description is required'),
    deadline: yup
        .date()
        .required('Deadline is required'),
    status: yup
        .mixed<typeof TODO_STATUS_VALUES[number]>()
        .oneOf([...TODO_STATUS_VALUES], `Status must be one of: ${TODO_STATUS_VALUES.join(', ')}`)
        .optional(),
    assigned_to: yup
        .string()
        .trim()
        .optional(),
});

export const updateTodoSchema = yup.object({
    title: yup
        .string()
        .trim(),
    description: yup
        .string()
        .trim(),
    deadline: yup
        .date(),
    status: yup
        .mixed<typeof TODO_STATUS_VALUES[number]>()
        .oneOf([...TODO_STATUS_VALUES], `Status must be one of: ${TODO_STATUS_VALUES.join(', ')}`),
    assigned_to: yup
        .string()
        .trim(),
    // created_by, created_at, updated_at are intentionally excluded → stripped via stripUnknown
});

export type CreateTodoInput = yup.InferType<typeof createTodoSchema>;
export type UpdateTodoInput = yup.InferType<typeof updateTodoSchema>;
