const mongoose = require('mongoose')

const userSchema = mongoose.Schema({

    name:{
        type : String,
        required:true
    },
    password:{
        type : String,
    },
    phonenumber : {
        type : String,
    },
    email : {
        type : String,
        required : true,
    },
    is_admin : {
        type : Number,
    },
    is_varified : {
        type : Number,
        default : 0
    },
    is_blocked: {
        type: Boolean,
        default: false // Default value is false, meaning not blocked
    }


});   

module.exports = mongoose.model('User',userSchema);