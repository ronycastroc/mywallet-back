import express from "express";
import cors from 'cors';
import dayjs from 'dayjs';
import joi from 'joi';
import { MongoClient, ObjectId } from 'mongodb';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

let date = dayjs().locale('pt-br').format('HH.mm.ss');

const mongoClient = new MongoClient(process.env.MONGO_URI);
let db;
mongoClient.connect().then(() => {
    db = mongoClient.db('mywallet');
});

/* Auth Routes */

const signUpSchema = joi.object({
    name: joi.string().alphanum().min(2).max(14).required(),
    email: joi.string().email().required(),
    password: joi.required()
})

app.post('/auth/sign-up', async (req, res) => {
    const user = req.body;

    const validation = signUpSchema.validate(req.body, { abortEarly: false });

    if(validation.error) {
        const error = validation.error.details.map(value => value.message);
        return res.status(422).send(error);
    }

    const passwordHash = bcrypt.hashSync(user.password, 10);

    try {
        const listUsers = await db.collection('users').find().toArray();
        
        const isExist = listUsers.find(value => value.name === user.name || value.email === user.email);        

        if(isExist) {
            return res.status(409).send('Nome ou E-mail já existente.');
        }

        await db.collection('users').insertOne({...user, password: passwordHash });

        console.log(user)
        res.sendStatus(201);

    } catch (error) {
        res.status(500).send(error.message);
    }
});

app.post('/auth/sign-in', async (req, res) => {
    const { email, password } = req.body;

    const user = await db.collection('users').findOne({ email });
    
    if (user && bcrypt.compareSync(password, user.password)) {
        const token = uuid();

        await db.collection('sessions').insertOne({
            userID: user._id,
            token
        })

        res.send(token);

    } else {
        res.sendStatus(409);
    }

});

app.post('/value', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if(!token) {
        res.sendStatus(401);
    }

    const session = await db.collection('sessions').findOne({ token });

    
});








app.listen(5000, () => console.log('Listen on 5000'));

