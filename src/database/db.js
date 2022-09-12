import { MongoClient } from "mongodb";
import dotenv from 'dotenv'

dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

async function mongo() {
    let db;

    try {
        await mongoClient.connect();
        db = mongoClient.db('mywallet');
        return db;
        
    } catch (error) {
        console.logo(error.message);
    }    
}

export default mongo;
