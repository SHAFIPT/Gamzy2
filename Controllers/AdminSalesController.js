const Order = require('../model/ordreModel');

const loadSalesReport = async (req, res) => {
    try {
        let { startDate, endDate } = req.query;

        // If no dates provided, default to all-time
        if (!startDate && !endDate) {
            startDate = new Date(0);
            endDate = new Date();
        } else {
            startDate = new Date(startDate);
            endDate = new Date(endDate);
            // Set endDate to end of the day
            endDate.setHours(23, 59, 59, 999);
        }

        const orders = await Order.find({
            orderDate: { $gte: startDate, $lte: endDate },
            $or: [
                { 'products.status': 'Delivered' },
                { 'products.status': 'Returned' },
                { 'products.status': 'Return Completed' },
                { 'products.returnStatus': 'Requested' }
            ]
        })
        .populate('userId', 'name')
        .populate('products.productId', 'productname');

        let salesCount = 0;
        let orderAmount = 0;
        let totalDiscount = 0;
        let refundedTotal = 0;
        let finalAmount = 0;

        orders.forEach(order => {
            const shippingChargePerProduct = order.shippingCharge / order.products.length;
            
            order.products.forEach(product => {
                const productTotal = product.price * product.quantity + shippingChargePerProduct;
                const productDiscount = (order.offerDiscount / order.products.length) + (order.couponDiscount / order.products.length);

                if (product.status === 'Delivered' || product.status === 'Returned' || product.returnStatus === 'Requested') {
                    salesCount++;
                    orderAmount += productTotal;
                    totalDiscount += productDiscount;
                    finalAmount += productTotal - productDiscount;
                }

                if (product.status === 'Return Completed') {
                    refundedTotal += productTotal - productDiscount;
                }
            });
        });

        finalAmount -= refundedTotal;

        const summaryData = {
            salesCount,
            orderAmount: orderAmount.toFixed(2),
            totalDiscount: totalDiscount.toFixed(2),
            refundedTotal: refundedTotal.toFixed(2),
            finalAmount: finalAmount.toFixed(2)
        };

        res.render('adminSalesReport', { orders, summaryData, startDate, endDate });
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

module.exports = {
    loadSalesReport
};