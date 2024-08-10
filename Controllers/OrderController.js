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

        const cart = await Cart.findOne({ userId }).populate({
            path: "products.productId",
            populate: { path: 'productCategory' }
        });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const { PaymentMethod, addressId, couponDiscount, shippingCharge } = req.body;

        if (!PaymentMethod || !addressId || couponDiscount === undefined || shippingCharge === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Fetch all active offers
        const offers = await Offer.find({ active: true });

        let totalOfferDiscount = 0;
        const products = await Promise.all(cart.products.map(async (cartItem) => {
            const product = await Product.findOne({ 
                _id: cartItem.productId._id, 
                'variants._id': cartItem.variantId 
            });

            if (!product) {
                throw new Error(`Product not found: ${cartItem.productId._id}`);
            }

            const variant = product.variants.id(cartItem.variantId);

            if (!variant) {
                throw new Error(`Variant not found: ${cartItem.variantId}`);
            }

            if (variant.quantity < cartItem.quantity) {
                throw new Error(`Product ${product.productname} is out of stock. Please remove it from the cart.`);
            }

            // Calculate the highest discount
            let highestDiscount = 0;
            offers.forEach(offer => {
                if (offer.applicableToProducts.includes(product._id) || 
                    offer.applicableToCategories.includes(product.productCategory._id)) {
                    highestDiscount = Math.max(highestDiscount, offer.discount);
                }
            });

            const originalPrice = product.price;
            const discountedPrice = originalPrice - (originalPrice * highestDiscount / 100);
            const offerDiscount = (originalPrice - discountedPrice) * cartItem.quantity;
            totalOfferDiscount += offerDiscount;

            return {
                productId: product._id,
                variantId: cartItem.variantId,
                quantity: cartItem.quantity,
                price: originalPrice,
                discountedPrice: discountedPrice,
                offerDiscount: offerDiscount,
                status: "Pending",
            };
        }));

        const orderSubtotal = products.reduce((total, item) => total + (item.discountedPrice * item.quantity), 0);
        const totalAmount = orderSubtotal - couponDiscount + parseFloat(shippingCharge);

        // Generate the order ID
        const orderId = generateOrderId();

        const orderData = { 
            userId,
            orderId: orderId,
            PaymentMethod,
            shippingCharge,
            offerDiscount: totalOfferDiscount,
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

        // ... rest of the function remains the same ...
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