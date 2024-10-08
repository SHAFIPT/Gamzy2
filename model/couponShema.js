
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponname : {
        type : String,
        required : true,
    },
    activationDate : {
        type : Date,
        required : true
    },
    expireDate : {
        type : Date,
        required : true
    },
    discount : {
        type : Number ,
        required : true
    },
    usedUsers : [
        {
            type : String
        }
    ],
    isActive : {
        type : Boolean,
        default : true
    },
    couponCode : {
        type  :String,
        required  :true
    },
    limitOfUse : {
        type : Number,
        required  :true
    },
    maxDiscountAmount : {
        type : Number
    },
    minimumPurchaseAmount: {
        type: Number,
        default: 0, // Default to 0 if not specified
    },
})

const Coupon = mongoose.model("coupons",couponSchema);

module.exports = Coupon;