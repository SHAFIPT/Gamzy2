const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
    Firstname : String,
    Lastname : String,
    state : String,
    address : String,
    Landmark : String,
    city : String,
    pincode : String,
    number : Number,
    user : {type : mongoose.Schema.Types.ObjectId , ref :'User'}
});

const Address = mongoose.model('Address',addressSchema);
module.exports = Address;