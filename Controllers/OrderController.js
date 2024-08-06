const Address = require('../model/addressShema');
const Order = require('../model/ordreModel');
const Product = require('../model/productModel');
const Cart = require('../model/cartShema');
const mongoose = require('mongoose');
// const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const generateOrderId = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // Generates a random hexadecimal string
};


const loadOrderPage = async (req, res) => {
    try {
        const userId = req.session.user;
        
        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

         // Fetch the most recent order
         const order = await Order.findOne({ userId })
         .populate('products.productId')  // Populate product details
         .sort({ orderDate: -1 })         // Sort by orderDate in descending order
         .exec();

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        res.render('orderDetails', { order });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};



const orderSummory = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const cart = await Cart.findOne({ userId }).populate("products.productId");

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const { PaymentMethod, addressId, discountAmount } = req.body;

        console.log("This is the discountAmount",discountAmount);
        

        console.log('This is my PaymentMethod', PaymentMethod);
        console.log("This is my addressId", addressId);

        // Generate the order ID
        const orderId = generateOrderId();
        console.log("Generated Order ID:", orderId);

        const address = await Address.findById(addressId);

        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        const products = cart.products.map(cartItem => ({
            productId: cartItem.productId._id,
            variantId: cartItem.variantId,
            quantity: cartItem.quantity,
            price: cartItem.productId.price,  // Assuming the price is in the product model
            status: "Pending",
        }));

        // Check stock availability and update variant quantities
        for (const cartItem of cart.products) {
            const product = await Product.findOne({ 
                _id: cartItem.productId._id, 
                'variants._id': cartItem.variantId 
            });

            const variant = product.variants.id(cartItem.variantId);

            if (variant.quantity < cartItem.quantity) {
                return res.status(400).json({ success: false, message: "Insufficient stock for some products." });
            }

            variant.quantity -= cartItem.quantity;
            await product.save();
        }

        const orderSubtotal = products.reduce((total, item) => total + (item.price * item.quantity), 0);

        // Determine shipping charge
        const shippingCharge = orderSubtotal < 500 ? 50 : 0;

        const totalAmount = orderSubtotal - discountAmount + shippingCharge;  // Adding shipping charge and subtracting discount

        const orderData = { 
            userId,
            orderId: orderId,  // Generating a new unique order ID
            PaymentMethod,
            shippingCharge,  // Replace with actual shipping charge
            discountAmount, // Add this line
            address: {
                name: `${address.Firstname} ${address.Lastname}`,
                number: address.number,
                address: address.streetaddress,
                street: address.streetaddress,
                pincode: address.pincode,
                state: address.state,
                Landmark: address.Landmark,
            },
            products,
            totalAmount,
            orderDate: new Date()
        };

        const order = new Order(orderData);
        await order.save();

        // Clear the cart after placing the order
        await Cart.deleteOne({ userId });

        res.json({ success: true });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};


const loadViewPage = async (req,res) =>{
    try {

        

        res.render('OrderdView')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports ={
    loadOrderPage,
    orderSummory,
    loadViewPage
}