import path from 'path';
import { config as loadEnv } from 'dotenv';

// Must be imported before other app modules so `process.env` is populated early.
const distDir = __dirname;
loadEnv({ path: path.resolve(distDir, '../src/.env') });
loadEnv({ path: path.resolve(distDir, '../.env') });
