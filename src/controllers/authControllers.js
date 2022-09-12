import joi from 'joi';
import mongo from '../database/db.js';
import bcrypt from 'bcrypt';
import { v4 as uuid } from 'uuid';

let db = await mongo();

const signUpSchema = joi.object({
    name: joi.string().alphanum().min(2).max(14).required(),
    email: joi.string().email().required(),
    password: joi.required()
});

const signUp = async (req, res) => {
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
};

const signIn = async (req, res) => {
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
};

export { signUp, signIn };