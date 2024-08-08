const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const VariantSchema = new Schema({
    color: {
        type: String,
        required: true
    },
    images: [String],
    quantity: {
        type: Number,
        required: true
    }
});

const productSchema = new Schema({
    productname: {
        type: String,
        required: true
    },
    productDescription: {
        type: String,
        required: true
    },
    productCategory: {
            type: Schema.Types.ObjectId,
            ref: 'Category' // Assuming 'Category' is your related model name
          },
    variants: [VariantSchema],
    date: {
        type: Date,
        default: Date.now,
        required: true
    },
    is_Listed: {
        type: Boolean,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    subCategory : {
        type : String
    },
    brand : {
        type : String
    },
    discountedPrice: {
        type: Number, // Optional
        required: false
    }
});

module.exports = mongoose.model('Product', productSchema);
