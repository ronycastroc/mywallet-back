import express from "express";
import cors from 'cors';
import authRouter from './routers/auth.routes.js';
import valueRouter from './routers/value.routers.js';

const app = express();
app.use(cors());
app.use(express.json());

app.use(authRouter);
app.use(valueRouter);

app.listen(5000, () => console.log('Listen on 5000'));

