import mongoose from 'mongoose';

import { TodoModel } from '../model/todo-model';
import { UserModel } from '../model/user-model';

const MONGO_URI = 'mongodb://root:root@mongodb:27017/db_api_training?authSource=admin';

// All models must be listed here so syncIndexes covers every collection.
const models = [TodoModel, UserModel];

export const connectMongoose = async (): Promise<void> => {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB');

    // Drops indexes that no longer exist in the schema and creates any new ones.
    // Safe for development; in production, prefer running migrations manually instead.
    await Promise.all(models.map((m) => m.syncIndexes()));
    console.log('Indexes synced');
};
