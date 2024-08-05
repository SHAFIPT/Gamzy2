
const Coupon = require('../model/couponShema')



const loadCouponPage = async (req,res) =>{
    try {

        res.render('ManageCoupon')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const addCoupon = async (req,res) =>{
    try {

        res.render("addCouponPage")
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}
 
const addCouponPage = async (req, res) => {
    try {
        // Extract data from the request body
        const { name, activationDate, expireDate, limitOfUse, discountAmount } = req.body;

        console.log(name);
        console.log(activationDate);
        console.log(expireDate);
        console.log(limitOfUse);
        console.log(discountAmount);
        
        
        
        
        
        
        // Create a new coupon instance
        const newCoupon = new Coupon({
            couponname: name,
            activationDate: activationDate,
            expireDate: expireDate,
            discount: discountAmount
        });

        // Save the coupon to the database
        await newCoupon.save();

        // Send a success response
        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        // Handle errors and send a failure response
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'An error occurred while adding the coupon' });
    }
};

module.exports = {
    loadCouponPage,
    addCoupon,
    addCouponPage
}