const User = require('../model/UserModel');
const  Address = require('../model/addressShema');
const Cart = require('../model/cartShema');
const  Offer = require('../model/offerModal')

const loadCheakoutPage = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;

            // Fetch addresses and cart data
            const addresses = await Address.find({ user: userId });
            const cart = await Cart.findOne({ userId }).populate({
                path: 'products.productId',
                populate: { path: 'variants' }
            });

            // Fetch all offers
            const offers = await Offer.find();

            // Calculate discounted prices for each product in the cart
            cart.products.forEach(productInCart => {
                const product = productInCart.productId;
                let discount = 0;

                // Check if any offers apply to the product or its category
                offers.forEach(offer => {
                    if (offer.applicableToProducts.includes(product._id) || offer.applicableToCategories.includes(product.productCategory._id)) {
                        discount = Math.max(discount, offer.discount); // Get the highest discount applicable
                    }
                });

                // Calculate discounted price
                const discountedPrice = product.price * (1 - discount / 100);
                productInCart.discountedPrice = discountedPrice;
            });

            // Render the checkout page with addresses and updated cart
            res.render('cheakOut', { addresses, cart });
        }
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
const breadCrumbCart = async (req,res) =>{
    try {
        const userId = req.session.user;

        // console.log('The user is here : ',userId);

        const cart = await Cart.find({ userId }).populate({
            path: 'products.productId',
            populate: { path: 'variants' }
        })


        // console.log('the cart is here :',cart);

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