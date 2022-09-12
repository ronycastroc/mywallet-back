import { ObjectId } from 'mongodb';
import joi from 'joi';
import dayjs from 'dayjs';
import mongo from '../database/db.js';

let db = await mongo();

let date = dayjs().locale('pt-br').format('DD/MM');

const valueSchema = joi.object({
    value: joi.number().required(),
    text: joi.string().required(),
    type: joi.valid('entry', 'out').required()
});

const createValue = async (req, res) => {
    const { authorization } = req.headers;
    const { value, text, type } = req.body;
    const token = authorization?.replace('Bearer ', '');

    const validation = valueSchema.validate(req.body, { abortEarly: false });

    if(validation.error) {
        const error = validation.error.details.map(value => value.message);
        return res.status(422).send(error);
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

};

const readValues = async (req, res) => {
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

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
};

const updateValue = async (req, res) => {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');
    const { value, text, type } = req.body;

    const validation = valueSchema.validate(req.body, {abortEarly: false });

    if(validation.error) {
        const error = validation.error.details.map(value => value.message);
        return res.status(422).send(error);
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
};

const deleteValue = async (req, res) => {
    const { id } = req.params;
    const { authorization } = req.headers;
    const token = authorization?.replace('Bearer ', '');

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
};

export { createValue, readValues, updateValue, deleteValue };