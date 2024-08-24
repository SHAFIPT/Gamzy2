const mongoose = require('mongoose');
require('dotenv').config();

const dbconnect = async () =>{
    try {
        process.env.MONGODB
        const conn = await mongoose.connect("mongodb://localhost:27017/GAMZY")
        console.log('mongodb connected');
    } catch (error) {
        console.log('error connecting to MongoDB',error.message);
    }
}

module.exports = dbconnect ;
