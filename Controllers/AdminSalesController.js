const Order = require('../model/ordreModel');
const PDFDocument = require('pdfkit');
const ExcelJS = require('exceljs');


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
            const totalOrderValue = order.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
  
            const shippingChargePerProduct = order.shippingCharge / order.products.length;
            
            order.products.forEach(product => {
                const productProportion = (product.price * product.quantity) / totalOrderValue;
                
                const productCouponDiscount = order.couponDiscount * productProportion;
                
                const productTotal = product.price * product.quantity + shippingChargePerProduct;
                
                // Only consider coupon discount, as offer discount is already applied to product price
                const productDiscount = productCouponDiscount;
                
                if (product.status === 'Delivered' || product.status === 'Returned' || product.returnStatus === 'Requested') {
                    salesCount++;
                    orderAmount += productTotal;
                    totalDiscount += productDiscount;
                    
                    if (product.status === 'Returned') {
                        const refundAmount = productTotal - productDiscount;
                        refundedTotal += refundAmount;
                        // Don't add to finalAmount for returned products
                    } else {
                        finalAmount += productTotal - productDiscount;
                    }
                }
            });
        });

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

const salesPdf = async (req,res) =>{
    const orders = await Order.find({}).populate('userId').exec();
    
    const doc = new PDFDocument();
    let filename = 'sales_report.pdf';
    filename = encodeURIComponent(filename);
    
    res.setHeader('Content-disposition', 'attachment; filename="' + filename + '"');
    res.setHeader('Content-type', 'application/pdf');
    
    doc.pipe(res);

    doc.fontSize(18).text('Sales Report', {
        align: 'center'
    });
    doc.moveDown();

    orders.forEach(order => {
        order.products.forEach(product => {
            if (['Delivered', 'Returned', 'Return Complete'].includes(product.status) || product.returnStatus === 'Requested') {
                doc.fontSize(12).text(`Order ID: ${order.orderId}`);
                doc.text(`User: ${order.userId.name}`);
                doc.text(`Order Date: ${new Date(order.orderDate).toLocaleDateString()}`);
                doc.text(`Payment Method: ${order.PaymentMethod}`);
                doc.text(`Payment Status: ${product.status}`);
                doc.text(`Quantity: ${product.quantity}`);
                const shippingChargePerProduct = order.shippingCharge / order.products.length;
                const discountPercentage = (order.offerDiscount / order.products.reduce((sum, p) => sum + p.price * p.quantity, 0)) * 100;
                const discountedUnitPrice = product.price * (1 - discountPercentage / 100);
                const unitPriceWithShipping = discountedUnitPrice + (shippingChargePerProduct / product.quantity);
                const totalPrice = (discountedUnitPrice * product.quantity) + shippingChargePerProduct - (order.couponDiscount / order.products.length);
                doc.text(`Price: ₹${unitPriceWithShipping.toFixed(2)}`);
                doc.text(`Total Discounted Price: ₹${totalPrice.toFixed(2)}`);
                if (product.returnStatus === 'Requested') {
                    doc.text(`Return Status: (Return Requested)`);
                } else if (product.status === 'Return Completed') {
                    doc.text(`Return Status: (Return Complete)`);
                }
                doc.moveDown();
            }
        });
    });

    doc.end();
};

const salesExl = async (req,res) => {
    const orders = await Order.find({}).populate('userId').exec();
    
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Sales Report');

    worksheet.columns = [
        { header: 'Order ID', key: 'orderId', width: 15 },
        { header: 'User', key: 'user', width: 20 },
        { header: 'Order Date', key: 'orderDate', width: 15 },
        { header: 'Payment Method', key: 'paymentMethod', width: 15 },
        { header: 'Payment Status', key: 'paymentStatus', width: 20 },
        { header: 'Quantity', key: 'quantity', width: 10 },
        { header: 'Price', key: 'price', width: 15 },
        { header: 'Total Discounted Price', key: 'totalDiscountedPrice', width: 25 }
    ];

    orders.forEach(order => {
        const shippingChargePerProduct = order.shippingCharge / order.products.length;
        order.products.forEach(product => {
            if (['Delivered', 'Returned', 'Return Complete'].includes(product.status) || product.returnStatus === 'Requested') {
                const discountPercentage = (order.offerDiscount / order.products.reduce((sum, p) => sum + p.price * p.quantity, 0)) * 100;
                const discountedUnitPrice = product.price * (1 - discountPercentage / 100);
                const unitPriceWithShipping = discountedUnitPrice + (shippingChargePerProduct / product.quantity);
                const totalPrice = (discountedUnitPrice * product.quantity) + shippingChargePerProduct - (order.couponDiscount / order.products.length);
                worksheet.addRow({
                    orderId: order.orderId,
                    user: order.userId.name,
                    orderDate: new Date(order.orderDate).toLocaleDateString(),
                    paymentMethod: order.PaymentMethod,
                    paymentStatus: product.status + (product.returnStatus === 'Requested' ? ' (Return Requested)' : ''),
                    quantity: product.quantity,
                    price: `₹${unitPriceWithShipping.toFixed(2)}`,
                    totalDiscountedPrice: `₹${totalPrice.toFixed(2)}`
                });
            }
        });
    });

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="sales_report.xlsx"');

    workbook.xlsx.write(res)
        .then(() => {
            res.end();
        });
};
const orderStatus = async (req, res) => {
    try {
        const now = new Date();
        
        // Helper function to get start of week, month, and year
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfYear = new Date(now.getFullYear(), 0, 1);

        const weekOrders = await Order.countDocuments({ orderDate: { $gte: startOfWeek } });
        const monthOrders = await Order.countDocuments({ orderDate: { $gte: startOfMonth } });
        const yearOrders = await Order.countDocuments({ orderDate: { $gte: startOfYear } });

        // Count orders based on their status
        const deliveredCount = await Order.countDocuments({ 'products.status': 'Delivered' });
        const returnedCount = await Order.countDocuments({ 'products.returnStatus': 'Return Confirmed' });
        const canceledCount = await Order.countDocuments({ 'products.status': 'Canceled' });

        res.json({
            weekly: weekOrders,
            monthly: monthOrders,
            yearly: yearOrders,
            delivered: deliveredCount,
            returned: returnedCount,
            canceled: canceledCount
        });
    } catch (error) {
        res.status(500).json({ message: 'Server Error', error });
    }
};

module.exports = {
    loadSalesReport,
    salesPdf,
    salesExl,
    orderStatus
};