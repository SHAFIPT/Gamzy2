const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const orderSchema = new Schema({
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    orderId: { type: String, required: true },
    discountAmount: { type: Number, default: 0 },
    offerDiscount: { type: Number, default: 0 }, // Add this field
    couponDiscount: { type: Number, default: 0 }, // Add this field
    PaymentMethod: { type: String, required: true },
    shippingCharge: { type: Number, required: true },
    address: {
        name: String,
        number: Number,
        address: String,
        street: String,
        pincode: String,
        state: String,
        Landmark: String,
    },
    products: [{
        productId: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
        variantId: { type: Schema.Types.ObjectId, required: true },
        quantity: { type: Number, required: true },
        price: { type: Number, required: true },
        status: { type: String },
        cancelReason: { type: String },
        returnReason: { type: String },  // Add this field for return reason
        returnStatus: { type: String }   // Add this field for return status
    }],
    totalAmount: { type: Number, required: true },
    orderDate: { type: Date, required: true }
});

const Order = mongoose.model('Order', orderSchema);
module.exports = Order;
