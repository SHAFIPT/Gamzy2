
const Coupon = require('../model/couponShema')



const loadCouponPage = async (req,res) =>{
    try {

         // Fetch all coupons from the database
         const coupons = await Coupon.find();

        res.render('ManageCoupon',{ coupons })
        
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
        const { name, activationDate, expireDate, limitOfUse, discountAmount, maxAmount, minimumPurchaseAmount } = req.body;

        // Convert values to numbers
        const discountPercent = parseFloat(discountAmount);
        const maxDiscount = parseFloat(maxAmount);
        const minPurchase = parseFloat(minimumPurchaseAmount);

        // ✅ LOGICAL VALIDATIONS
        if (discountPercent <= 0 || discountPercent > 100) {
            return res.status(400).json({ message: 'Discount must be between 1% and 100%' });
        }

        if (maxDiscount <= 0) {
            return res.status(400).json({ message: 'Max discount amount must be greater than 0' });
        }

        if (minPurchase < 0) {
            return res.status(400).json({ message: 'Minimum purchase amount must be non-negative' });
        }

        const calculatedDiscount = minPurchase * (discountPercent / 100);

        if (calculatedDiscount > maxDiscount) {
            return res.status(400).json({
                message: `With ${discountPercent}% discount on ₹${minPurchase}, discount = ₹${calculatedDiscount.toFixed(2)}, which exceeds the max allowed ₹${maxDiscount}`
            });
        }

        // Generate a random number for coupon code
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // 4-digit number
        const couponCode = `${name.toLowerCase()}${randomNumber}`;

        console.log("This is my couponCode", couponCode);

        // Create a new coupon instance
        const newCoupon = new Coupon({
            couponname: name,
            activationDate,
            expireDate,
            discount: discountPercent,
            couponCode,
            limitOfUse,
            maxDiscountAmount: maxDiscount,
            minimumPurchaseAmount: minPurchase
        });

        // Save the coupon to the database
        await newCoupon.save();

        // Send a success response
        res.status(201).json({ message: 'Coupon added successfully' });
    } catch (error) {
        console.error('Error adding coupon:', error);
        res.status(500).json({ message: 'An error occurred while adding the coupon' });
    }
};
        

const loadEditPage = async (req,res) =>{
    try {

        const coupon = await Coupon.findById(req.params.id);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.render('editCouponPage', {coupon})
        
    } catch (error) {
        console.error('Error edit coupon:', error);
        res.status(500).json({ message: 'An error occurred while adding the coupon' });
    }
}


const updateCoupon = async (req,res) =>{
    try {
        const { name, activationDate, expireDate, limitOfUse, discountAmount,maxAmount } = req.body;

        let coupon = req.params.id;
        

        const updatedCoupon = await Coupon.findByIdAndUpdate(req.params.id, {
            couponname: name,
            activationDate,
            expireDate,
            limitOfUse,
            maxDiscountAmount : maxAmount,
            discount: discountAmount
        }, { new: true });

        

        if (!updatedCoupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        res.json({ success: true, message: 'Coupon updated successfully' });
    } catch (error) {
        console.error('Error updating coupon:', error);
        res.status(500).json({ message: 'An error occurred while updating the coupon' });
    }
};

const removeCoupon = async (req, res) => {
    try {
        const couponId = req.params.id;

        let coupon = await Coupon.findByIdAndDelete(couponId);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not removed' });
        }

        res.status(200).json({ message: 'Coupon removed successfully' });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'An error occurred while removing the coupon' });
    }
};

module.exports = {
    loadCouponPage,
    addCoupon,
    addCouponPage,
    loadEditPage,
    updateCoupon,
    removeCoupon
}