import { model, Schema, type Document } from 'mongoose';

//interface
export interface IAuth extends Document {
    user: any;
    session_id: string;
    expiration: Date;
}

//schema
const authSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: 'User',
            required: true,
        },
        session_id: {
            type: String,
            required: true,
            trim: true,
        },
        expiration: {
            type: Date,
            required: true,
            trim: true,
        },
    },
    {
        collection: 'auth',
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        },
    },
);

authSchema.index({ user: 1, session_id: 1});

export const AuthModel = model<IAuth>('Auth', authSchema);
