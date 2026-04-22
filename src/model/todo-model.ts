import { type Document, model, Schema } from 'mongoose';

export const TODO_STATUS_VALUES = [
    'pending',
    'in progress',
    'completed',
    'cancelled',
    'deleted',
] as const;

export type TodoStatus = (typeof TODO_STATUS_VALUES)[number];

//interface 
//schema
//model
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
            required: true,
            type: Date,
            default: Date.now,
        },
        updated_at: {
            required: true,
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


// for per-user todos
todoSchema.index({ assigned_to: 1, status: 1, deadline: 1 });

// for all todos
todoSchema.index({ status: 1, deadline: 1 });

export const TodoModel = model<ITodo>('Todo', todoSchema);










/*
 * --- MongoDB Compass (Insert Document) ---
 * Collection: todo (explicit via Schema options `{ collection: 'todo' }`; default would be "todos").
 * Raw inserts bypass Mongoose defaults — include created_at / updated_at if not relying on app code.
 *
{
  "created_at": { "$date": "2026-04-21T12:00:00.000Z" },
  "updated_at": { "$date": "2026-04-21T12:00:00.000Z" },
  "deleted_at": null,
  "completed_at": null,
  "created_by": "REPLACE_WITH_VALID_USER_ID_STRING",
  "title": "Compass sample todo",
  "description": "Paste this block into Compass JSON mode, then replace IDs.",
  "deadline": { "$date": "2026-05-01T17:00:00.000Z" },
  "status": "pending",
  "assigned_to": "REPLACE_WITH_VALID_USER_ID_STRING"
}
 *
 * --- Postman (JSON body) ---
 * Use ISO-8601 strings for dates. Omit _id unless updating; replace ID placeholders.
 *
{
  "created_at": "2026-04-21T12:00:00.000Z",
  "updated_at": "2026-04-21T12:00:00.000Z",
  "deleted_at": null,
  "completed_at": null,
  "created_by": "REPLACE_WITH_VALID_USER_ID_STRING",
  "title": "Postman sample todo",
  "description": "Body for APIs that accept this shape (e.g. future POST /todo).",
  "deadline": "2026-05-01T17:00:00.000Z",
  "status": "in progress",
  "assigned_to": "REPLACE_WITH_VALID_USER_ID_STRING"
}
 *
 * status enum: "pending" | "in progress" | "completed" | "cancelled" | "deleted"
 */