//baseic express setup - hello world

import type { Application, Request, Response } from 'express';
import express from 'express';

const app:Application = express();
const PORT = process.env.PORT || 3000;

app.get('/', (req: Request, res: Response) => {
    res.send({ message: 'Hello World'});
});

app.listen(PORT, () => {
    console.log(`Express is running at PORT ${PORT}`);
});
