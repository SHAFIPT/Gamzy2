const Address = require('../model/addressShema');
const User = require('../model/UserModel')
const mongoose=require('mongoose');
const Order = require('../model/ordreModel');
const Wishlist = require('../model/wishlistShema')
const Wallet = require('../model/walletSchema')
const Product = require('../model/productModel');
const PDFDocument = require('pdfkit-table');
const fs = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');

const loadMyAccount = async (req,res) =>{
    try {

        const userId = req.session.user;
        const users = await User.findById( userId);
        res.render('Useraccount', {users})

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const loadaddress = async (req,res)=>{
    try {

        if (req.session.user) {
            const userId = req.session.user;
            // Find addresses by user ID
            const addresses = await Address.find({ user: userId });
            res.render('address', { addresses });

        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const addAddress = async (req,res)=>{
    try {

        const {firstname,lastname,state, streetaddress,landmark, city,pincode,number,email} = req.body;


         // Create a new address instance
         const newAddress = new Address({
            Firstname: firstname,
            Lastname: lastname,
            state: state,
            streetaddress: streetaddress,
            Landmark: landmark,
            city: city,
            pincode: pincode,
            number: number,
            email : email,
            user: new mongoose.Types.ObjectId(req.session.user )// Assuming you have user information in the request object
        });
 
        // Save the address to the database
        await newAddress.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
}

const getAddressById = async (req, res) => {
    try {
        const addressId = req.params.id;

        const address = await Address.findById(addressId);

        if (address) {
            res.json({ success: true, address });
        } else {
            res.json({ success: false, message: 'Address not found' });
        }
    } catch (error) {
        console.error('Error fetching address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const editAddress = async (req, res) => {
    const { id, firstname, lastname, state, streetaddress, landmark, city, pincode, number, email } = req.body;
    try {
        const address = await Address.findById(id);
        if (address) {
            address.Firstname = firstname;
            address.Lastname = lastname;
            address.state = state;
            address.streetaddress = streetaddress;
            address.Landmark = landmark;
            address.city = city;
            address.pincode = pincode;
            address.number = number;
            address.email = email;
            await address.save();
            res.json({ success: true, message: 'Address updated successfully' });
        } else {
            res.json({ success: false, message: 'Address not found' });
        }
    } catch (error) {
        console.error('Error updating address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const removeAddress = async (req,res)=>{
    try {

        const addressId = req.params.id;

        const result = await Address.findByIdAndDelete(addressId);

        if (result) {
            res.json({ success: true, message: 'Address deleted successfully' });
        } else {
            res.json({ success: false, message: 'Address not found' });
        }
        
    } catch (error) {
        console.error('Error deleting address:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}
const loadOrderDetails = async (req, res) => {
    try {
        const userId = req.session.user;
        const page = parseInt(req.query.page) || 1;
        const limit =  2;
        const skip = (page - 1) * limit;

        if (!userId) {
            return res.status(404).send("User not found...!");
        }

        const ordersCount = await Order.countDocuments({ userId });
        const orders = await Order.find({ userId })
            .sort({ orderDate: -1 }) // Sort orders by orderDate in descending order
            .skip(skip)
            .limit(limit)
            .populate({
                path: 'products.productId',
                populate: {
                    path: 'variants'
                }
            })
            .populate('address');

        const totalPages = Math.ceil(ordersCount / limit);

      
        res.render('OrderInUserAcc', {
            orders,
            currentPage: page,
            totalPages,
            noOrders: true // Add this flag
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
}

const orderCancel = async (req, res) => {
    try {
        const { orderId } = req.params;
        const { productId, variantId } = req.query;
        const { cancelReason } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        const orderItem = order.products.find(item => item.productId.equals(productId) && item.variantId.equals(variantId));

        if (!orderItem) {
            return res.status(404).json({ success: false, message: "Product not found in the order" });
        }

        if (orderItem.status === "Canceled") {
            return res.status(400).json({ success: false, message: "This product has already been cancelled" });
        }

        // Restore product quantity
        const product = await Product.findOne({ 
            _id: productId, 
            'variants._id': variantId 
        });

        if (product) {
            const variant = product.variants.id(variantId);
            if (variant) {
                variant.quantity += orderItem.quantity;
                await product.save();
            }
        }

        // Calculate refund amount
        const totalOrderValue = order.products.reduce((sum, product) => sum + (product.price * product.quantity), 0);
        const productProportion = (orderItem.price * orderItem.quantity) / totalOrderValue;
        const productCouponDiscount = order.couponDiscount * productProportion;
        const refundAmount = (orderItem.price * orderItem.quantity) - productCouponDiscount;

        console.log("This is my totalOrderValue :",totalOrderValue);
        console.log("This is my productProportion :",productProportion);
        console.log("This is my productCouponDiscount :",productCouponDiscount);
        console.log("This is my refundAmount :",refundAmount);
        

        if (order.PaymentMethod === 'Razorpay' && order.paymentStatus === 'Paid') {
            // Handle Razorpay refund
            const razorpayRefund = await razerpay.refunds.create({
                payment_id: order.paymentId, // Payment ID from Razorpay for the original transaction
                amount: refundAmount * 100 // Amount in paise
            });

            if (!razorpayRefund) {
                return res.status(500).json({ success: false, message: 'Failed to process Razorpay refund' });
            }
        }

        // Update wallet for COD or Razorpay refunds
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
            entry: `Refund for cancellation: order ${order.orderId}, product ${orderItem.productId}`,
            date: new Date()
        });
        await wallet.save();

        // Update order
        orderItem.status = "Canceled";
        orderItem.cancelReason = cancelReason;

        // Check if all products are now cancelled
        const allProductsCancelled = order.products.every(product => product.status === 'Canceled');
        if (allProductsCancelled) {
            order.totalAmount = 0;
            order.couponDiscount = 0;
        }

        // Save the updated order
        await order.save();

        res.json({ success: true, refundAmount });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

const orderReturn = async (req, res) => {
    try {
        const { returnReason } = req.body;
        const { orderId } = req.params;

        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        // Find the order by orderId (note: orderId is a string, not an ObjectId)
        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Update the order products with return reason and status
        order.products.forEach(product => {
            if (product.status === 'Delivered') {
                product.returnReason = returnReason;
                product.returnStatus = 'Requested'; // or 'Pending' if you prefer
                product.status = 'Returned'; // Update the product status to 'Returned'
            }
        });
        // Save the updated order
        await order.save();

        res.json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error processing return:', error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
};


const updateProfile = async (req, res) => {
    try {
        const { name, phoneNumber } = req.body;
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const user = await User.findByIdAndUpdate(userId, { name, phonenumber: phoneNumber }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: "User not found" });
        }
        res.json({ success: true, message: 'Profile updated successfully' });
    } catch (error) {
        console.error('Error updating profile:', error); // Log error details
        console.error('Error stack trace:', error.stack); // Log stack trace
        res.status(500).json({ success: false, message: 'Failed to update profile' });
    }
}


const updatePassword = async (req, res) => {
    try {
        const { oldPassword, newPassword } = req.body;

        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: 'User not authenticated' });
        }

        // Find the user in the database
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        // Check if the old password is correct
        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' });
        }

        // Hash the new password
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);

        // Update the user's password
        user.password = hashedNewPassword;
        await user.save();

        res.json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error updating password:', error);
        res.status(500).json({ success: false, message: 'Failed to update password' });
    }
};
const loadWalletPage = async (req, res) => {
    try {
        const userId = req.session.user; // Assuming you store user ID in session
        let wallet = await Wallet.findOne({ user: userId });

        if (!wallet) {
            // If wallet doesn't exist, create a new one with zero balance
            wallet = new Wallet({
                user: userId,
                balance: 0,
                transactions: []
            });
            await wallet.save();
        }

        // Ensure transactions is always an array
        wallet.transactions = wallet.transactions || [];

        res.render('wallet', { wallet });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
const loadWishList = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ error: 'Please log in to add products to your cart.' });
        }


        const userId = req.session.user; // Assuming user is logged in and user ID is available in req.session.user
        const wishlist = await Wishlist.findOne({ user: userId }).populate('products.product');

        if (wishlist) {
            for (let item of wishlist.products) {
                if (item.variant) {
                    const product = await Product.findById(item.product._id).select('variants');
                    const variant = product.variants.id(item.variant);
                    item.variant = variant;
                }
            }
        }

        res.render('wishlist', { wishlist, currentPage: 'wishlist' }); // Pass wishlist to the template
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
const addWishList = async (req, res) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'Please log in to add products to your wishlist.' });
        }

        const { productId, variantId } = req.body;
        const userId = req.session.user; // Assuming user is logged in and user ID is available in req.session.user

        let wishlist = await Wishlist.findOne({ user: userId });
        if (!wishlist) {
            wishlist = new Wishlist({ user: userId, products: [] });
        }

        // Check if the product is already in the wishlist
        const existingProductIndex = wishlist.products.findIndex(
            p => p.product.toString() === productId && p.variant.toString() === variantId
        );

        if (existingProductIndex !== -1) {
            // Product is already in the wishlist
            return res.status(200).json({ message: 'Product is already in your wishlist.' });
        }

        // Product is not in the wishlist, add it
        wishlist.products.push({ product: productId, variant: variantId });
        await wishlist.save();

        res.status(200).json({ message: 'Product added to wishlist.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
const removeWishList = async (req,res)=>{
    try {
        const { productId, variantId } = req.body;
        const userId = req.session.user
        

        // Find the user's wishlist
        const wishlist = await Wishlist.findOne({ user: req.session.user });

        if (!wishlist) {
            return res.status(404).json({ error: 'Wishlist not found' });
        }

        // Remove the item from the wishlist
        wishlist.products = wishlist.products.filter(item =>
            !(item.product._id.equals(productId) && item.variant._id.equals(variantId))
        );

        await wishlist.save();

        res.status(200).json({ message: 'Item removed from wishlist' });
    } catch (error) {
        console.error('Error removing from wishlist:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
};

const downloadOrderPdf = async (req,res)=>{
    const order = await Order.findOne({ _id: req.params.orderId }).populate('products.productId');

    if (!order) {
        return res.status(404).send('Order not found');
    }

    const doc = new PDFDocument({ margin: 50 });
    const filename = `Order_${order.orderId}.pdf`;

    res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
    res.setHeader('Content-Type', 'application/pdf');

    doc.pipe(res);

    // Helper function to create a table
    const createTable = (headers, rows) => {
        const table = {
            headers: headers,
            rows: rows
        };

        doc.table(table, {
            prepareHeader: () => doc.font('Helvetica-Bold').fontSize(10),
            prepareRow: (row, i) => doc.font('Helvetica').fontSize(10)
        });
    };

    // Add company name (replace with your own)
    doc.fontSize(20).text('GAMZY', 50, 57)
    //    .fontSize(10).text('123 Business Street, City, Country', 50, 80)
       .text('Phone: +91 9876546788 | Email: Gamzy@gamil.com', 50, 95);

    doc.moveDown();

    // Order Summary
    doc.fontSize(16).text('Order Summary', { underline: true });
    doc.moveDown();

    createTable(
        ['Order ID', 'Order Date', 'Total Amount', 'Payment Status'],
        [[
            order.orderId,
            new Date(order.orderDate).toLocaleDateString(),
            `₹${order.totalAmount.toFixed(2)}`,
            order.paymentStatus
        ]]
    );

    doc.moveDown();

    // Shipping Address
    doc.fontSize(16).text('Shipping Address', { underline: true });
    doc.moveDown();

    doc.fontSize(10).text(`${order.address.name}`);
    doc.text(`${order.address.address},`);
    doc.text(`${order.address.Landmark},`);
    doc.text(`${order.address.city}, ${order.address.state} - ${order.address.pincode}`);
    doc.text(`Phone: +${order.address.number}`);

    doc.moveDown();

    // Product Details
    doc.fontSize(16).text('Products', { underline: true });
    doc.moveDown();

    const productRows = order.products.map(product => {
        const variant = product.productId.variants.find(v => v._id.toString() === product.variantId.toString());
        return [
            `${product.productId.productname} (${variant.color})`,
            product.quantity,
            `₹${product.price.toFixed(2)}`,
            `₹${(product.price * product.quantity).toFixed(2)}`
        ];
    });

    createTable(
        ['Product', 'Quantity', 'Unit Price', 'Total'],
        productRows
    );

    doc.moveDown();

    // Total
    doc.fontSize(12).text(`Grand Total: ₹${order.totalAmount.toFixed(2)}`, { align: 'right' });

    // Footer
    const pageCount = doc.bufferedPageRange().count;
    for (let i = 0; i < pageCount; i++) {
        doc.switchToPage(i);
        doc.fontSize(8).text(
            `Page ${i + 1} of ${pageCount}`,
            50,
            doc.page.height - 50,
            { align: 'center' }
        );
    }

    doc.end();
};

module.exports = {
    loadMyAccount,
    loadaddress,
    addAddress,
    getAddressById,
    editAddress,
    removeAddress,
    loadOrderDetails,
    orderCancel,
    orderReturn,
    updateProfile,
    updatePassword,
    loadWalletPage,
    loadWishList,
    addWishList,
    removeWishList,
    downloadOrderPdf
}