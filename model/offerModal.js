const mongoose = require('mongoose')

const offerSchema = new mongoose.Schema({
    name : {type : String ,  required : true},
    activeDate : {type : Date , required  :true},
    expireDate : {type : Date , required : true},
    discount : {type : Number , required : true},
    type : {type : String , enum : ['product' , 'category'], required : true},
    applicableToProducts : [
        {type : mongoose.Schema.Types.ObjectId , ref : 'Product'},
    ],
    applicableToCategories : [
        {type : mongoose.Schema.Types.ObjectId , ref : 'Category'},
    ],
    active: { type: Boolean, default: true } // New field for active/inactive status
});

offerSchema.index({expireDate : 1});


const Offer = mongoose.model('Offer',offerSchema);

module.exports = Offer;