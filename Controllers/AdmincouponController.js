
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
        const { name, activationDate, expireDate, limitOfUse, discountAmount ,maxAmount,minimumPurchaseAmount} = req.body;

        console.log(name);
        console.log(activationDate);
        console.log(expireDate);
        console.log(limitOfUse);
        console.log(discountAmount);
        console.log(maxAmount);
        console.log("This coupon max:",minimumPurchaseAmount);

        // Generate a random number
        const randomNumber = Math.floor(1000 + Math.random() * 9000); // Generates a 4-digit number

        // Generate coupon code by appending the random number to the coupon name
        const couponCode = `${name.toLowerCase()}${randomNumber}`;

        console.log("This is my couponCode",couponCode);
        

        // Create a new coupon instance
        const newCoupon = new Coupon({
            couponname: name,
            activationDate: activationDate,
            expireDate: expireDate,
            discount: discountAmount,
            couponCode: couponCode,
            limitOfUse,
            maxDiscountAmount:maxAmount,
            minimumPurchaseAmount

             // Set the generated coupon code
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