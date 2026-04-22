import { type Document, model, Schema } from 'mongoose';


//interface 
//schema
//model
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