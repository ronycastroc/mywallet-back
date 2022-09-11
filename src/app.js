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

let date = dayjs().locale('pt-br').format('DD/MM');

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
            userId: user._id,
            token
        })

        delete user.password
        
        res.send({
            ...user,
            token,
        });

    } else {
        res.sendStatus(409);
    }

});

/* Values Routes */ 

const valueSchema = joi.object({
    value: joi.number().required(),
    text: joi.string().required(),
    type: joi.valid('entry', 'out').required()
})

app.post('/values', async (req, res) => {
    const { authorization } = req.headers;
    const { value, text, type } = req.body;
    const token = authorization?.replace('Bearer ', '');

    const validation = valueSchema.validate(req.body, { abortEarly: false });

    if(validation.error) {
        const error = validation.error.details.map(value => value.message);
        return res.status(422).send(error);
    }

    if(!token) {
        return res.sendStatus(401);
    }

    try {
        const session = await db.collection('sessions').findOne({ token });

        if(!session) {
            return res.sendStatus(402);
        }
        
        const created = await db.collection('values').insertOne({
            value,
            text,
            type,
            userId: ObjectId(session.userId),
            date,
        });

        res.sendStatus(201);
        
    } catch (error) {
        res.status(500).send(error.message);
    }

});

app.get('/values', async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

    if(!token) {
        return res.sendStatus(401);
    }

    try {
        const session = await db.collection('sessions').findOne({ token });

        if(!session) {
            return res.sendStatus(401);
        }

        const user = await db.collection('users').findOne({
            _id: session.userId
        });

        if(user) {
            const values = await db.collection('values').find({
                userId: user._id
            }).toArray()
    
            res.send(values);

        } else {
            res.sendStatus(401);
        }

    } catch (error) {
        res.status(500).send(error.message); 
    }
    
});

app.put('/values/:id', async (req, res) => {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    const { value, text, type } = req.body;

    const validation = valueSchema.validate(req.body, {abortEarly: false });

    if(validation.error) {
        const error = validation.error.details.map(value => value.message);
        return res.status(422).send(error);
    }

    if (!token) {
        return res.sendStatus(401);
    }

    try {
        await db.collection('values').updateOne({
            _id: new ObjectId(id)
        }, {
            $set: {
                value,
                text,
                type
            }
        })

        res.sendStatus(200);
    } catch (error) {
        res.status(500).send(error.message);
    }
})

app.delete('/values/:id', async (req, res) => {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');


    if(!token) {
        return res.sendStatus(401);
    }

    try {
        const findValue = await db.collection('values').findOne({_id: new ObjectId(id)});

        if(!findValue) {
            return res.sendStatus(404);
        }

        await db.collection('values').deleteOne({_id: new ObjectId(id)});

        res.sendStatus(200);

    } catch (error) {
        res.status(500).send(error.message);
    }

})

app.listen(5000, () => console.log('Listen on 5000'));

