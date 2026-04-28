import 'reflect-metadata';
import './load-env';

import cookieParser from 'cookie-parser';
import express from 'express';
import { InversifyExpressServer } from 'inversify-express-utils';
import containerInversify from './configs/inversify.configs';
import { connectMongoose } from './configs/mongoose.configs';
const cors = require('cors');

//Learnings: instantiate the server
const serverInversify = new InversifyExpressServer(containerInversify);
const PORT = process.env.PORT || 3000;

// Learnings: set configs
serverInversify.setConfig((app) => {
    app.use(express.json());
    app.use(express.urlencoded({ extended: true }));
    app.use(cookieParser());
    app.use(cors({
        credentials: true,
        origin: true
    }));
});

const app = serverInversify.build();

// Learnings: Connect to MongoDB (and sync indexes) before accepting traffic.
connectMongoose()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Express is running at PORT ${PORT}`);
        });
    })
    .catch((err: unknown) => {
        console.error('Failed to connect to MongoDB:', err);
        process.exit(1);
    });