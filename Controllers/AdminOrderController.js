const Order = require('../model/ordreModel');
const { findById } = require('../model/productModel');
const mongoose = require('mongoose')

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

        res.render('OrderdView', {order})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const updateStatus = async (req,res) =>{
    try {

        const {productId , status ,OrderId} = req.body;

        // console.log("This is my order now",OrderId)

        const allowedTransitions = {
            'pending' : ['Dispatched'],
            'Dispatched' : ['Out For Delivery'],
            'Out For Delivery' : ['Delivered'],
            'Delivered' : []
        }


        const order = await Order.findById(OrderId);


        if (!order) {
            return res.status(404).json({message: 'Order not found'});
        }

        console.log("this is my order to status:", order);

         // Find the product in the order and update its status
         const productiItem = order.products.id(productId);

         console.log("this is my product to status:", productiItem );

         const currentStatus = productiItem.status;
         if(allowedTransitions[currentStatus] && !allowedTransitions[currentStatus].includes(status)){
            return res.status(400).json({message : `Invalid status transition form ${currentStatus} to ${status}`})
         }

         if (productiItem) {
            
            productiItem.status = status;

             await order.save(); // Save changes to the order

             res.status(200).json({message: 'Status updated successfully'});
         } else {
             res.status(404).json({message: 'Product not found'});
         }

    } catch (error) {
        console.log(error);
        res.status(500).json({message: 'Internal Server Error'});
    }
}

module.exports ={
    loadOrderPage,
    loadViewPage,
    updateStatus
}

