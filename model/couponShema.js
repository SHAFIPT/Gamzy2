
const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    couponname : {
        type : String,
        required : true,
    },
    activationDate : {
        type : String,
        required : true
    },
    expireDate : {
        type : String,
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
    }
})

const Coupon = mongoose.model("coupons",couponSchema);

module.exports = Coupon;