const Coupon = require('../model/couponShema');
const Cart = require('../model/cartShema')



const applyCoupon = async (req, res) => {
    const { couponCode } = req.body;
    const userId = req.session.user;

    try {
        // Fetch the coupon details
        const coupon = await Coupon.findOne({ couponCode });

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found' });
        }

        // Check if the coupon is still active and has not expired
        const currentDate = new Date();
        const activationDate = coupon.activationDate; // Already a Date object
        const expireDate = coupon.expireDate; // Already a Date object


        if (!coupon.isActive || currentDate < activationDate || currentDate > expireDate) {
            return res.status(400).json({ message: 'Coupon is not active or has expired' });
        }

        // Check if the coupon usage limit has been reached
        if (coupon.limitOfUse <= coupon.usedUsers.length) {
            return res.status(400).json({ message: 'Coupon usage limit has been reached' });
        }

        // Check if the user has already used this coupon
        if (coupon.usedUsers.includes(userId)) {
            return res.status(400).json({ message: 'Coupon has already been used by this user' });
        }

        // Fetch the cart for the specified user
        const cart = await Cart.findOne({ userId }).populate('products.productId');

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Calculate the subtotal
        const orderSubtotal = cart.products.reduce((sum, product) => {
            const productPrice = product.productId.price;
            const quantity = product.quantity;
            return sum + (productPrice * quantity);
        }, 0);

        // Check if the subtotal is eligible for the coupon
        if (orderSubtotal < 500) {
            return res.status(400).json({ message: 'Coupon is only valid for orders over ₹500' });
        }

        // Calculate the discount as a percentage
        const discountPercentage = coupon.discount;
        const discountAmount = orderSubtotal * (discountPercentage / 100);
        const newTotal = orderSubtotal - discountAmount;

        // Update the coupon to include the user who used it
        coupon.usedUsers.push(userId);
        await coupon.save();

        res.status(200).json({ discount: discountAmount, newTotal });
    } catch (error) {
        console.error('Error applying coupon:', error);
        res.status(500).json({ message: 'An error occurred while applying the coupon' });
    }
};

const getCoupons = async (req, res) => {
    try {
        console.log('Fetching coupons...'); // Debugging log
        const coupons = await Coupon.find({
            isActive: true,
            expireDate: { $gt: new Date() }
        });

        console.log('Fetched coupons:', coupons); // Debugging log

        if (!coupons.length) {
            return res.status(404).json({ message: 'No coupons available' });
        }

        res.status(200).json(coupons);
    } catch (error) {
        console.error('Error fetching coupons:', error);
        res.status(500).json({ message: 'An error occurred while fetching coupons' });
    }
};



const loadHomePage = async (req,res) => {
    try {
        
        res.render('home2')

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    applyCoupon,
    getCoupons,
    loadHomePage
}