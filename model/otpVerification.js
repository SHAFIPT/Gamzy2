const mongoose = require('mongoose');

const otpSchema = mongoose.Schema({
    Email : {
        type : String,
        required : true,
    },
    otp : {   
        type : String,   
        required : true,
    },   
    createdAt : {
        type: Date,
        default: Date.now,
        expires: 30, 
    },
})

module.exports = mongoose.model('OTP' , otpSchema);