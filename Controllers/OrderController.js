const Address = require('../model/addressShema');
const Order = require('../model/ordreModel');
const Product = require('../model/productModel');
const Cart = require('../model/cartShema');
const Razorpay = require('razorpay');
const mongoose = require('mongoose');
const  Offer = require('../model/offerModal')
// const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');

const generateOrderId = () => {
    return crypto.randomBytes(6).toString('hex').toUpperCase(); // Generates a random hexadecimal string
};



function generateorderId() {
    // Your logic to generate a unique order ID
    return `ORDER_${Math.floor(Math.random() * 1000000)}`;
}

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

// console.log("Razorpay Key ID:", process.env.key_id);
// console.log("Razorpay Key Secret:", process.env.key_secret);

const razerpay = new Razorpay({
    key_id: process.env.key_id,
    key_secret: process.env.key_secret
});

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

        const { PaymentMethod, addressId, offerDiscount, couponDiscount, shippingCharge } = req.body;

        console.log("This is the offer discounted : ", offerDiscount);

        if (!PaymentMethod || !addressId || offerDiscount === undefined || couponDiscount === undefined || shippingCharge === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

       
        const products = await Promise.all(cart.products.map(async cartItem => {
            let discountPrice = cartItem.productId.price;
            const activeOffer = await Offer.findOne({ 
                applicableToProducts: cartItem.productId._id,
                active: true,
                activeDate: { $lte: new Date() },
                expireDate: { $gte: new Date() }
            });

            if (activeOffer) {
                discountPrice -= offerDiscount;
            }

            console.log("this is discountedPrice :", discountPrice);

            return {
                productId: cartItem.productId._id,
                variantId: cartItem.variantId,
                quantity: cartItem.quantity,
                price: discountPrice,
                status: "Pending",
            };
        }));

        // Check stock availability
        for (const cartItem of cart.products) {
            const product = await Product.findOne({ 
                _id: cartItem.productId._id, 
                'variants._id': cartItem.variantId 
            });

            const variant = product.variants.id(cartItem.variantId);

            if (variant.quantity < cartItem.quantity) {
                return res.status(400).json({ 
                    success: false, 
                    message: `Product ${cartItem.productId.productname} is out of stock. Please remove it from the cart.` 
                });
            }
        }

        const orderSubtotal = products.reduce((total, item) => total + (item.price * item.quantity), 0);
        const totalAmount = orderSubtotal - couponDiscount + shippingCharge;

        // Generate the order ID
        const orderId = generateOrderId();

        const orderData = { 
            userId,
            orderId: orderId,
            PaymentMethod,
            shippingCharge,
            offerDiscount,
            couponDiscount,
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

        const updateProductQuantities = async () => {
            for (const cartItem of cart.products) {
                await Product.updateOne(
                    { _id: cartItem.productId._id, 'variants._id': cartItem.variantId },
                    { $inc: { 'variants.$.quantity': -cartItem.quantity } }
                );
            }
        };

        if (PaymentMethod === 'Cashondelivary') {
            const order = new Order(orderData);
            await order.save();

            await updateProductQuantities();

            // Clear the cart after placing the order
            await Cart.deleteOne({ userId });

            return res.json({ success: true, redirectUrl: "/user/order" });
        } else if (PaymentMethod === 'razerpay') {
            const options = {
                amount: totalAmount * 100, // amount in the smallest currency unit
                currency: "INR",
                receipt: `receipt_${orderId}`,
            };

            try {
                const razorpayOrder = await razerpay.orders.create(options);
                orderData.razorpayOrderId = razorpayOrder.id;

                const order = new Order(orderData);
                await order.save();

                await updateProductQuantities();

                // Clear the cart after placing the order
                await Cart.deleteOne({ userId });

                return res.json({ success: true, razorpayOrder });
            } catch (error) {
                return res.status(500).json({ success: false, message: error.message });
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }
    } catch (error) {
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