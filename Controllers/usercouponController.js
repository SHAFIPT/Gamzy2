const Coupon = require('../model/couponShema');
const Cart = require('../model/cartShema');
const Offer = require('../model/offerModal')

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
        const activationDate = coupon.activationDate;
        const expireDate = coupon.expireDate;

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
        const cart = await Cart.findOne({ userId }).populate({
            path: 'products.productId',
            populate: { path: 'productCategory' } // Ensure product category is populated
        });

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found' });
        }

        // Fetch all offers
        const offers = await Offer.find();

        // Calculate the subtotal considering product offers
        const orderSubtotal = cart.products.reduce((sum, productInCart) => {
            const product = productInCart.productId;
            let productPrice = product.price;
            let discount = 0;

            // Check if any offers apply to the product or its category
            offers.forEach(offer => {
                if (
                    offer.applicableToProducts.includes(product._id) ||
                    offer.applicableToCategories.includes(product.productCategory._id)
                ) {
                    discount = Math.max(discount, offer.discount); // Get the highest discount applicable
                }
            });

            // Calculate discounted price
            const discountedPrice = productPrice * (1 - discount / 100);

            console.log('This is product price to calculate:', discountedPrice);

            const quantity = productInCart.quantity;
            return sum + (discountedPrice * quantity);
        }, 0);

        console.log('This is orderSubtotal:', orderSubtotal);

        // Check if the subtotal is eligible for the coupon
        if (orderSubtotal < 500) {
            return res.status(400).json({ message: 'Coupon is only valid for orders over ₹500' });
        }

        // Calculate the discount as a percentage
        const discountPercentage = coupon.discount;
        let discountAmount = orderSubtotal * (discountPercentage / 100);

        // Apply the maximum discount amount if defined
        discountAmount = discountAmount > coupon.maxDiscountAmount ? coupon.maxDiscountAmount : discountAmount;

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
        // console.log('Fetching coupons...'); 
        const coupons = await Coupon.find({
            isActive: true,
            expireDate: { $gt: new Date() }
        });

        // console.log('Fetched coupons:', coupons); 

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



const getUserCart = async (userId) => {
    try {
        return await Cart.findOne({ userId }).populate('products.productId');
    } catch (error) {
        console.error('Error fetching user cart:', error);
        throw error;
    }
};

const findCoupon = async (couponCode) => {
    try {
        return await Coupon.findOne({ couponCode });
    } catch (error) {
        console.error('Error finding coupon:', error);
        throw error;
    }
};
const removeCouponFromUser = async (userId, couponCode) => {
    try {
        return await Cart.findOneAndUpdate(
            { userId },
            { $unset: { couponCode: '' } }, // Adjust this if coupon is stored differently
            { new: true } // Returns the updated document
        );
    } catch (error) {
        console.error('Error removing coupon from user:', error);
        throw error;
    }
};
const removeCoupon = async (req, res) => {
    const { couponCode } = req.body;

    console.log("This is the couponCode:", couponCode);

    if (!couponCode) {
        return res.status(400).json({ message: 'Coupon code is required.' });
    }

    try {
        const userId = req.session.user; // Adjust as per your user identification mechanism
        const cart = await getUserCart(userId);

        if (!cart) {
            return res.status(404).json({ message: 'Cart not found.' });
        }

        const coupon = await findCoupon(couponCode);

        if (!coupon) {
            return res.status(404).json({ message: 'Coupon not found.' });
        }

        // Remove the coupon from the user's cart
        const updatedCart = await removeCouponFromUser(userId, couponCode);

        // Recalculate the cart totals
        const subtotal = updatedCart.products.reduce((sum, product) => {
            const price = product.discountedPrice ? product.discountedPrice : product.productId.price;
            console.log("Product price:", price, "Quantity:", product.quantity); // Log product details
            return sum + price * product.quantity;
        }, 0);

        console.log("This my subtotal:", subtotal);

        const finalTotal = subtotal; // Adjust based on how you handle discounts

        res.json({
            message: 'Coupon removed successfully.',
            newTotal: finalTotal
        });
    } catch (error) {
        console.error('Error removing coupon:', error);
        res.status(500).json({ message: 'An error occurred while removing the coupon.' });
    }
};
const getCart = async (req, res) => {
    try {
        const userId = req.session.user; // Adjust as per your user identification mechanism
        const cart = await getUserCart(userId);
        if (!cart) {
            return res.status(404).json({ message: 'Cart not found.' });
        }
        res.json(cart);
    } catch (error) {
        console.error('Error fetching cart data:', error);
        res.status(500).json({ message: 'Error fetching cart data' });
    }
};

module.exports = {
    applyCoupon,
    getCoupons,
    loadHomePage,
    removeCoupon,
    getCart
}