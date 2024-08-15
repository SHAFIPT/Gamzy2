const Order = require('../model/ordreModel');
const Wallet = require('../model/walletSchema')
const { findById } = require('../model/productModel');
const mongoose = require('mongoose')



const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};

const loadOrderPage = async (req, res) => {
    try {
        const orders = await Order.find().populate('userId', 'name').exec();

        // console.log("This is my order datails ",orders);

        res.render('orderList', { orders });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
const loadViewPage = async (req,res) =>{
    try {

        const OrderId = req.params.OrderId;

        // console.log("This i passed orderId",OrderId);

        const order = await Order.findById(OrderId).populate('userId').populate('products.productId');

        // console.log("This is my admin order details :", order);

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.render('OrderdView', {order ,truncateDescription})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const updateStatus = async (req, res) => {
    try {
        const { productId, status, orderId } = req.body;

        const order = await Order.findById(orderId).populate('userId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const productItem = order.products.id(productId);

        if (!productItem) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        const currentStatus = productItem.status;
        const currentReturnStatus = productItem.returnStatus;

        // Define allowed status transitions
        const allowedTransitions = {
            'Pending': ['Dispatched', 'Cancelled'],
            'Dispatched': ['Out For Delivery', 'Cancelled'],
            'Out For Delivery': ['Delivered', 'Cancelled'],
            'Delivered': []
        };

        // Function to handle refund
        const handleRefund = async (reason) => {
            const userId = order.userId;
            
            // Calculate the total order value before coupon discount
            const totalOrderValue = order.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
            
            // Calculate the proportion of this product's value to the total order value
            const productProportion = (productItem.price * productItem.quantity) / totalOrderValue;
            
            // Calculate the coupon discount applied to this product
            const productCouponDiscount = order.couponDiscount * productProportion;
            
            // Calculate the refund amount (product price minus its share of coupon discount)
            const refundAmount = (productItem.price * productItem.quantity) - productCouponDiscount;

            let wallet = await Wallet.findOne({ user: userId });
            if (!wallet) {
                wallet = new Wallet({
                    user: userId,
                    balance: 0,
                    transactions: []
                });
            }
            wallet.balance += refundAmount;
            wallet.transactions.push({
                amount: refundAmount,
                type: 'credit',
                entry: `Refund for ${reason}: order ${order.orderId}, product ${productItem.productId}`,
                date: new Date()
            });
            await wallet.save();

            // Update the order's total amount and coupon discount
            // order.totalAmount = Math.max(0, order.totalAmount - refundAmount);
            // order.couponDiscount = Math.max(0, order.couponDiscount - productCouponDiscount);
        };

        // Handle return request
        if (currentReturnStatus === 'Requested') {
            if (status === 'Return Confirmed') {
                productItem.status = 'Returned';
                productItem.returnStatus = 'Return Confirmed';
                await handleRefund('return acceptance');
            } else if (status === 'Rejected') {
                productItem.status = 'Rejected';
                productItem.returnStatus = 'Rejected';
            } else {
                return res.status(400).json({ message: `Invalid status transition from Requested to ${status}` });
            }
        } else {
            // Check normal status transitions
            if (!(currentStatus in allowedTransitions) || !allowedTransitions[currentStatus].includes(status)) {
                return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${status}` });
            }

            // Handle cancellation
            if (status === 'Cancelled') {
                await handleRefund('order cancellation');
            } else {
                productItem.status = status;
                productItem.returnStatus = undefined;
            }
        }

        // Check if all products are now cancelled or returned
        // const allProductsCancelledOrReturned = order.products.every(product => 
        //     product.status === 'Cancelled' || product.status === 'Returned'
        // );
        // if (allProductsCancelledOrReturned) {
        //     order.totalAmount = 0;
        //     order.couponDiscount = 0;
        // }

        
        // Check if all products are now delivered
        const allDelivered = order.products.every(product => product.status === 'Delivered');
        if (allDelivered) {
            order.paymentStatus = 'Paid';
        }

        await order.save();


        await order.save();

        res.status(200).json({ message: 'Status updated successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

module.exports ={
    loadOrderPage,
    loadViewPage,
    updateStatus
}

