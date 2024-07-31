const express = require('express');
const router = express.Router();
const path = require('path');
const userMiddleware = require('../middlewares/usermiddleware');
const session = require('express-session');
const config = require('../config/confisg'); // Double-check your path here
const connectDB = require('../config/database'); // Adjust the path as needed
const nocache = require('nocache');
const passport = require('passport');
require('../passport'); // Ensure passport configuration is loaded

// Import userController and userListController
const userController = require('../Controllers/userController');
const userListcontroller = require('../Controllers/Userlistcontroller');
const cheakoutController = require('../Controllers/cheakoutController');
const myaccountController = require('../Controllers/myAccountcontroller');
const orderController     = require('../Controllers/OrderController')
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');


// Apply express-session middleware first
router.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
}));

router.use(passport.initialize());
router.use(passport.session());

router.use(nocache());

// Google OAuth routes
router.get('/auth/google', passport.authenticate('google', { scope: ['email', 'profile'] }));

router.get('/GoogleAuth', 
    passport.authenticate('google', {
        successRedirect : '/user/success',
        failureRedirect : '/user/failure'
    }
));
 
//success
router.get('/success',userController.successGoogleLogin)

router.get('/failure',userController.failureGoogleLogin)
 
// Serve static files from the 'assets' directory
router.use('/static', express.static(path.join(__dirname, '..', 'public', 'assets')));

// Define routes
router.get('/signUp', userController.loadsignUp);
router.post('/signUp', userController.insertSignUp);
router.get('/', userController.loadhome);
router.get('/login', userMiddleware.isLogout, userController.loadlogin);
router.post('/login', userMiddleware.isLogout, userController.verifyLogin);
router.get('/verifyOTP', userMiddleware.isLogout, userController.getOTPPage);
router.post('/verifyOTP', userMiddleware.isLogout, userController.verifyOTP);
router.post('/resendOTP', userMiddleware.isLogout, userController.resendOTP);

//forgotPassword
router.get('/forgotPassword',userMiddleware.isLogout, userController.forgotPassword)
router.post('/resetPassword', userMiddleware.isLogout, userController.updatePassword)


//logout
router.get('/LogOut',userController.logOut)

// Shop page
router.get('/ShopPage', userListcontroller.LoadShopage);

// Product Details page
router.get('/productDetails/product/:productId/variant/:variantId', userListcontroller.loadProductDetails);


//Product cart page
router.get('/productCart',userMiddleware.isLogin,userListcontroller.loadProductCart);
router.post('/addToCart',userListcontroller.addToCart)

router.post('/cartUpdate',userListcontroller.updateCart );
router.post('/productCart/remove',userListcontroller.removeCart)

//CheakOut page
router.get('/cheakOut',cheakoutController.loadCheakoutPage)



//userAccount
router.get('/myaccount',userMiddleware.isLogin,myaccountController.loadMyAccount);
router.get('/address',userMiddleware.isLogin,myaccountController.loadaddress);
router.post('/addAddress',myaccountController.addAddress)

//editaddress
router.get('/myaddress/:id', myaccountController.getAddressById);
router.post('/editAddress', myaccountController.editAddress);

//deleteaddress
router.delete('/removeaddress/:id', myaccountController.removeAddress)


//order page
router.get("/order",userMiddleware.isLogin,orderController.loadOrderPage);
router.post("/place-order",userMiddleware.isLogin,orderController.orderSummory);


module.exports = router;
