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
        
        console.log("productId :", productId);
        console.log("orderId :", orderId);
        console.log("status :", status);
        
        // Define allowed status transitions
        const allowedTransitions = {
            'Pending': ['Dispatched'],
            'Dispatched': ['Out For Delivery'],
            'Out For Delivery': ['Delivered'],
            'Delivered': []
        };

        const allowedReturnTransitions = {
            'Return Confirmed': ['Return Processing'],
            'Return Processing': ['Ready to Pickup'],
            'Ready to Pickup': ['Return Completed'],
            'Return Completed': []
        };

        const order = await Order.findById(orderId).populate('userId');

        if (!order) {
            return res.status(404).json({ message: 'Order not found' });
        }

        const productItem = order.products.id(productId);

        if (!productItem) {
            return res.status(404).json({ message: 'Product not found in order' });
        }

        const currentStatus = productItem.status;
        
        // Determine the valid transitions based on the current status
        let validTransitions;
        if (currentStatus in allowedTransitions) {
            validTransitions = allowedTransitions[currentStatus];
        } else if (currentStatus in allowedReturnTransitions) {
            validTransitions = allowedReturnTransitions[currentStatus];
        } else {
            return res.status(400).json({ message: `Invalid current status ${currentStatus}` });
        }

        // Check if the new status is a valid transition
        if (!validTransitions.includes(status)) {
            return res.status(400).json({ message: `Invalid status transition from ${currentStatus} to ${status}` });
        }

        productItem.status = status;

        // If status is changed to "Return Completed", refund the amount to the user's wallet
        if (status === 'Return Completed') {
            const userId = order.userId;
            const refundAmount = order.totalAmount * (productItem.price * productItem.quantity) / order.products.reduce((sum, p) => sum + (p.price * p.quantity), 0);

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
                entry: `Refund for order ${order.orderId}, product ${productItem.productId}`,
                date: new Date()
            });

            await wallet.save();
        }

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

