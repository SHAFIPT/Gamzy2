const mongoose = require('mongoose');
require('dotenv').config();

const dbconnect = async () =>{
    try {
        
        const conn = await mongoose.connect(process.env.MONGODB)
        console.log('mongodb connected');
    } catch (error) {
        console.log('error connecting to MongoDB',err.message);
    }
}

module.exports = dbconnect ;
