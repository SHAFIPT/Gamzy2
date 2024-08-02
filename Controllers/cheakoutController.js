const User = require('../model/UserModel');
const  Address = require('../model/addressShema');
const Cart = require('../model/cartShema');


const loadCheakoutPage = async (req,res)=>{
    try {

        if (req.session.user) {
            const userId = req.session.user;
            // console.log('This address open page userId:', userId);

            // Find addresses by user ID
            const addresses = await Address.find({ user: userId });

            const cart = await Cart.findOne({userId}).populate("products.productId")


            // console.log('This is my cart id :', cart);

            // console.log('This address open page addresses for userId:', addresses);
            res.render('cheakOut',{ addresses , cart})

    }
    
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

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