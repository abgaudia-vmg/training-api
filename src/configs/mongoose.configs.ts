import mongoose from 'mongoose';
import { TodoModel } from '../model/todo-model';
import { UserModel } from '../model/user-model';

// const MONGO_URI_DOCKER = 'mongodb://root:root@mongodb:27017/db_api_training?authSource=admin';
const MONGO_URI_DOCKER = process.env.MONGO_URI_DOCKER!;
const MONGO_URI_LOCAL = process.env.MONGO_URI_LOCAL!;
const models = [TodoModel, UserModel];
export const connectMongoose = async (): Promise<void> => {
    await mongoose.connect(MONGO_URI_LOCAL);
    await Promise.all(models.map((model) => model.syncIndexes()));
};
