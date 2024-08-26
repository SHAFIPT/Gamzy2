const User = require('../model/UserModel');
const  Address = require('../model/addressShema');
const Cart = require('../model/cartShema');
const  Offer = require('../model/offerModal');
const Wallet = require("../model/walletSchema")

const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};

const loadCheakoutPage = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;

            const user = await User.findById(userId);

            // Fetch addresses and cart data
            const addresses = await Address.find({ user: userId });
            let cart = await Cart.findOne({ userId }).populate({
                path: 'products.productId',
                populate: [
                    { path: 'variants' },
                    { path: 'productCategory' }
                ]
            });

            // If cart is not found, initialize an empty cart
            if (!cart) {
                cart = {
                    products: []
                };
            }

              // Fetch wallet balance
              const wallet = await Wallet.findOne({ user: userId });
              const walletBalance = wallet ? wallet.balance : 0;
  

            // Fetch all active offers
            const offers = await Offer.find({ active: true });

            // Calculate discounted prices for each product in the cart
            cart.products.forEach(productInCart => {
                const product = productInCart.productId;
                let highestDiscount = 0;

                // Check if any offers apply to the product or its category
                offers.forEach(offer => {
                    if (offer.applicableToProducts.includes(product._id) || 
                        offer.applicableToCategories.includes(product.productCategory._id)) {
                        highestDiscount = Math.max(highestDiscount, offer.discount);
                    }
                });

                // Calculate discounted price
                const discountedPrice = product.price - (product.price * highestDiscount / 100);
                
                productInCart.discountedPrice = discountedPrice;
                productInCart.discount = highestDiscount;

                console.log(`Product: ${product.productname}, Original Price: ${product.price}, Discount: ${highestDiscount}%, Discounted Price: ${discountedPrice}`);
            });

            // Calculate totals
            const subtotal = cart.products.reduce((sum, product) => {
                return sum + product.discountedPrice * product.quantity;
            }, 0);

            const totalDiscount = cart.products.reduce((sum, product) => {
                return sum + (product.productId.price - product.discountedPrice) * product.quantity;
            }, 0);

            const shippingCharge = subtotal < 500 ? 50 : 0;
            const total = subtotal + shippingCharge;

            // Render the checkout page with addresses, updated cart, and calculated totals
            res.render('cheakOut', { 
                addresses, 
                cart, 
                user,
                walletBalance,
                subtotal: subtotal.toFixed(2),
                totalDiscount: totalDiscount.toFixed(2),
                shippingCharge: shippingCharge.toFixed(2),
                total: total.toFixed(2),
                truncateDescription
            });
        } else {
            res.redirect('/login'); // Redirect to login if user is not authenticated
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const breadCrumbCart = async (req,res) =>{
    try {
        const userId = req.session.user;

        const cart = await Cart.find({ userId }).populate({
            path: 'products.productId',
            populate: { path: 'variants' }
        })

        res.render('userCart', { cart }); // Render cart.ejs template with cart data


    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

module.exports = {
    loadCheakoutPage,
    breadCrumbCart
}