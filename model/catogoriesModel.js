const mongoose = require('mongoose');

const CatogorySchema = mongoose.Schema({

    name : {
        type : String,
        required : true
    },
    description :{
        type : String
    },
    is_listed : {
        type : Boolean
    }
})

module.exports = mongoose.model('Category',CatogorySchema)