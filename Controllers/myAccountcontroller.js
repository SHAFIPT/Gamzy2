const Address = require('../model/addressShema');
const User = require('../model/UserModel')
const mongoose=require('mongoose');
const Order = require('../model/ordreModel');
const Product = require('../model/productModel')

const loadMyAccount = async (req,res) =>{
    try {

        const userId = req.session.user;
        // console.log(userId)
        const users = await User.findById( userId);

        // console.log('This in my account userId :', users);
        
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
            // console.log('This address open page userId:', userId);

            // Find addresses by user ID
            const addresses = await Address.find({ user: userId });

            // console.log('This address open page addresses for userId:', addresses);

            res.render('address', { addresses });

        // const address = await User.findById(userId);


        // console.log('This is my address',address );
        }
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const addAddress = async (req,res)=>{

    // console.log("helowww");
    try {

        const {firstname,lastname,state, streetaddress,landmark, city,pincode,number,email} = req.body;

        // console.log('This is my add address Controllers');

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
        // console.log('helowww');

        const addressId = req.params.id;

        const address = await Address.findById(addressId);

        // console.log('This is my address id : ',addressId);

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

        // console.log('This is Backend address id :',addressId);

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
        const { orderId } = req.params; // Get orderId from params
        const { cancelReason } = req.body; // Get cancelReason from body
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ success: false, message: "User not authenticated" });
        }

        const order = await Order.findOne({ _id: orderId, userId });

        if (!order) {
            return res.status(404).json({ success: false, message: "Order not found" });
        }

        // Restore product quantities
        for (const orderItem of order.products) {
            const product = await Product.findOne({ 
                _id: orderItem.productId, 
                'variants._id': orderItem.variantId 
            });

            if (product) {
                const variant = product.variants.id(orderItem.variantId);
                if (variant) {
                    variant.quantity += orderItem.quantity;
                    await product.save();
                }
            }
        }

        // Change order status to canceled
        order.products.forEach(product => {
            product.status = "Canceled";
            product.cancelReason = cancelReason;
        });
        order.status = "Canceled"; // You might still want to update the order status too
        await order.save();

        // Calculate overall status
        const overallStatus = order.products.some(product => product.status === 'Canceled') ? 'Canceled' : 'Pending';

        res.json({ success: true, overallStatus });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: error.message });
    }
};

module.exports = {
    loadMyAccount,
    loadaddress,
    addAddress,
    getAddressById,
    editAddress,
    removeAddress,
    loadOrderDetails,
    orderCancel
}