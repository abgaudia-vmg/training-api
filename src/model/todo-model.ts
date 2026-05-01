import { type Document, model, Schema } from 'mongoose';

export const TODO_STATUS_VALUES = [
    'pending',
    'in progress',
    'completed',
    'cancelled',
    'deleted',
] as const;

export type TodoStatus = (typeof TODO_STATUS_VALUES)[number];

export interface ITodo extends Document {
    // timestamps
    created_at: Date;
    updated_at: Date;
    deleted_at?: Date | null;
    completed_at?: Date | null;
    //todo details
    created_by: any; // user id (_id from 'user' collection)
    title: string;
    description: string;
    deadline: Date;
    status: TodoStatus;
    assigned_to: any; // user id (_id from 'user' collection)
}

export const todoSchema = new Schema<ITodo>(
    {
        created_at: {
            // required: true,
            type: Date,
            default: Date.now,
        },
        updated_at: {
            // required: true,
            type: Date,
            default: Date.now,
        },
        deleted_at: {
            required: false,
            type: Date,
            default: null,
        },
        completed_at: {
            required: false,
            type: Date,
            default: null,
        },
        created_by: {
            required: true,
            type: Schema.Types.ObjectId,
            ref: 'User',
        },
        title: {
            required: true,
            type: String,
        },
        description: {
            required: true,
            type: String,
        },
        deadline: {
            required: true,
            type: Date,
        },
        status: {
            required: true,
            type: String,
            default: 'pending',
            enum: [...TODO_STATUS_VALUES],
        },
        assigned_to: {
            required: true,
            type: Schema.Types.ObjectId,
            ref: 'User',
        }
    },
    {
        collection: 'todo',
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    },
);

todoSchema.index({ assigned_to: 1, status: 1, deadline: 1 });
todoSchema.index({ status: 1, deadline: 1 });

export const TodoModel = model<ITodo>('Todo', todoSchema);