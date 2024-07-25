const mongoose = require('mongoose');

const dbconnect = async () =>{
    try {
        
        const conn = await mongoose.connect('mongodb://127.0.0.1:27017/GAMZY')
        console.log('mongodb connected');
    } catch (error) {
        console.log('error connecting to MongoDB',err.message);
    }
}

module.exports = dbconnect ;