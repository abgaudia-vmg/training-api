import { type Document, model, Schema } from 'mongoose';

export interface IUser extends Document {
    _id: Schema.Types.ObjectId;
    username: string;
    email: string;
    first_name: string;
    last_name: string;
    password: string;
    user_type:  'staff' | 'admin';
    deleted_at: Date | null;
}

const userSchema = new Schema<IUser>(
    {
        username: {
            type: String,
            required: true,
            trim: true, // remove white space
            unique: true, // serve as user identifier
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            match: [/^\S+@\S+\.\S+$/, 'Please enter a valid email address'],
        },
        first_name: {
            type: String,
            required: true,
            trim: true,
        },
        last_name: {
            type: String,
            required: true,
            trim: true,
        },
        password: {
            type: String,
            required: true,
            trim: true,
            match: [/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, 'Password must be at least 8 characters and include 1 uppercase letter, 1 lowercase letter, and 1 number'],
        },
        user_type: {
            type: String,
            // default: "staff" // for todo
            default: 'staff',
            enum: ['staff', 'admin'],
            required: true,
        },
        deleted_at: {
            type: Date,
            default: null,
        },
    },
    {
        collection: 'user',
        timestamps: {
            createdAt: 'created_at',
            updatedAt: 'updated_at',
        }
    }
);

export const UserModel = model<IUser>('User', userSchema);