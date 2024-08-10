const Order = require('../model/ordreModel');


const loadSalesReport = async (req,res)=>{
    try {

        const orders = await Order.find()
        .populate('userId', 'name')
        .populate('products.productId', 'productname'); // Ensure to populate the productname field


        res.render('adminSalesReport' ,{ orders })
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadSalesReport
}