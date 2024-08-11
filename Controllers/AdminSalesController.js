const Order = require('../model/ordreModel');

const loadSalesReport = async (req, res) => {
    try {
        const orders = await Order.find({ 'products.status': 'Delivered' })
            .populate('userId', 'name')
            .populate('products.productId', 'productname');

        let salesCount = 0;
        let orderAmount = 0;
        let totalDiscount = 0;
        let refundedTotal = 0;
        let finalAmount = 0;

        orders.forEach(order => {
            order.products.forEach(product => {
                if (product.status === 'Delivered') {
                    salesCount++;
                    const productTotal = product.price * product.quantity;
                    orderAmount += productTotal;
                    
                    // Calculate discount for this product
                    const productDiscount = (order.offerDiscount / order.products.length) + (order.couponDiscount / order.products.length);
                    totalDiscount += productDiscount;
                    
                    finalAmount += productTotal - productDiscount;
                } else if (product.status === 'Refunded') {
                    refundedTotal += product.price * product.quantity;
                }
            });
        });

        // Adjust final amount by subtracting refunded total
        finalAmount -= refundedTotal;

        const summaryData = {
            salesCount,
            orderAmount: orderAmount.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            refundedTotal: refundedTotal.toFixed(2),
            finalAmount: finalAmount.toFixed(2)
        };

        res.render('adminSalesReport', { orders, summaryData });
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadSalesReport
};