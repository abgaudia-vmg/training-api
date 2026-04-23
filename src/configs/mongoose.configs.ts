import mongoose from 'mongoose';
import { TodoModel } from '../model/todo-model';
import { UserModel } from '../model/user-model';

const MONGO_URI = 'mongodb://root:root@mongodb:27017/db_api_training?authSource=admin';
const models = [TodoModel, UserModel];
export const connectMongoose = async (): Promise<void> => {
    await mongoose.connect(MONGO_URI);
    await Promise.all(models.map((model) => model.syncIndexes())); //avoid single char variables
};
