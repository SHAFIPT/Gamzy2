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
            path: 'products.productId',
            populate: [
                { path: 'variants' },
                { path: 'productCategory' }
            ]
        });

        if (!cart) {
            return res.status(404).json({ success: false, message: "Cart not found" });
        }

        const { PaymentMethod, addressId, couponDiscount } = req.body;

        if (!PaymentMethod || !addressId || couponDiscount === undefined) {
            return res.status(400).json({ success: false, message: "Missing required fields" });
        }

        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(404).json({ success: false, message: "Address not found" });
        }

        // Fetch all active offers
        const offers = await Offer.find({ active: true });

        let totalDiscount = 0;
        const products = cart.products.map(cartItem => {
            const product = cartItem.productId;
            let highestDiscount = 0;

            // Check if any offers apply to the product or its category
            offers.forEach(offer => {
                if (offer.applicableToProducts.includes(product._id) || 
                    offer.applicableToCategories.includes(product.productCategory._id)) {
                    highestDiscount = Math.max(highestDiscount, offer.discount);
                }
            });

            // Calculate discounted price
            const originalPrice = product.price * cartItem.quantity;
            const discountAmount = originalPrice * (highestDiscount / 100);
            const discountedPrice = originalPrice - discountAmount;

            totalDiscount += discountAmount;

            return {
                productId: product._id,
                variantId: cartItem.variantId,
                quantity: cartItem.quantity,
                originalPrice: product.price,
                price: discountedPrice / cartItem.quantity, // Store per-unit price
                discount: highestDiscount,
                status: "Pending",
            };
        });

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

        const subtotal = products.reduce((total, item) => total + (item.price * item.quantity), 0);
        
        const shippingCharge = subtotal < 500 ? 50 : 0;
        const totalAmount = subtotal - couponDiscount + shippingCharge;


        if (PaymentMethod === 'Cashondelivary' && totalAmount > 1000) {
            return res.status(400).json({ success: false, message: "Cash on Delivery is only available for orders below 1000" });
        }

        const orderId = generateOrderId();

        const orderData = { 
            userId,
            orderId,
            PaymentMethod,
            shippingCharge,
            offerDiscount: totalDiscount,
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
            subtotal,
            totalAmount,
            paymentStatus: "Pending",
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

                return res.json({ success: true, razorpayOrder, order_id: order._id });
            } catch (error) {
                
                // orderData.paymentStatus = "Failed";
                const order = new Order(orderData);
                await order.save();

                return res.status(500).json({ success: true, message: "Razorpay order creation failed" });
            }
        } else {
            return res.status(400).json({ success: false, message: "Invalid payment method" });
        }
    } catch (error) {
        console.error("Error placing order:", error);
        return res.status(500).json({ success: false, message: "Internal server error" });
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

const retryPayment = async(req,res) =>{
    const { orderId } = req.params;
    console.log("This is order id :",orderId);
    

    try {
        // Fetch the order details
        const order = await Order.findById(orderId);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        // Create a new Razorpay order
        const razorpayOrder = await razerpay.orders.create({
            amount: order.totalAmount * 100, // Amount in paise
            currency: 'INR',
            receipt: order._id.toString(),
            payment_capture: 1
        });

        // Send the new order details to the client
        res.json({
            success: true,
            razorpayOrder
        });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ success: false, message: 'Failed to create Razorpay order' });
    }
};


const updateStatus = async (req,res)=>{

    const { orderId, paymentId} = req.body;
    try {
    // Find the order and update the payment status
    const order = await Order.findById(orderId);
    if (!order) {
        return res.status(404).json({ success: false, message: 'Order not found' });
    }

    order.paymentStatus = 'Paid';
    await order.save();

    res.json({ success: true });
} catch (error) {
    console.error('Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update payment status' });
}
};

module.exports ={
    loadOrderPage,
    orderSummory,
    loadViewPage,
    retryPayment,
    updateStatus
}