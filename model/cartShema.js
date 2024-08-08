const mongoose = require('mongoose');

const cartSchema = new mongoose.Schema({
    userId : {
        type : mongoose.Schema.Types.ObjectId,
        ref : 'User',
        required : true,
    },
    products : [
        {
            productId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Product',
                required : true,
            },
            variantId : {
                type : mongoose.Schema.Types.ObjectId,
                ref : 'Product.variants',
                required : true,
            },
            quantity : {
                type : Number,
                default : 1,
            },
        },
    ],
    couponCode: {  // Add this field to store applied coupon code
        type: String,
        default: null,
    },
})

module.exports = mongoose.model('Cart' , cartSchema); 