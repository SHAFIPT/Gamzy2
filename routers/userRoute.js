const express = require('express');
const router = express.Router();
const path = require('path');
const userMiddleware = require('../middlewares/usermiddleware');
const checkBlockedStatus = require('../middlewares/CheakBlockStatus')
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
const orderController     = require('../Controllers/OrderController');
const productsController = require('../Controllers/userproductShowcontroller');
const userCouponController = require('../Controllers/usercouponController');
const { auth } = require('googleapis/build/src/apis/abusiveexperiencereport');
const { appendFile } = require('fs');


const checkOrderStatus = (req, res, next) => {
    if (req.session.orderPlaced) {
        return res.redirect("/user/order");
    }
    next();
};

// Apply express-session middleware first
router.use(session({
    secret: config.sessionSecret,
    resave: false,
    saveUninitialized: true,
}));

router.use(passport.initialize());
router.use(passport.session());

router.use(nocache());

// Apply the checkBlockedStatus middleware globally for all routes
router.use(checkBlockedStatus);



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
router.get('/forgotPassword', userMiddleware.isLogout, userController.loadForgetPage);
router.post('/forgotPassword', userMiddleware.isLogout, userController.forgotPassword);
router.get('/resetPassword/:token', userMiddleware.isLogout, userController.loadResetPasswordPage);
router.post('/resetPassword/:token', userMiddleware.isLogout, userController.updatePassword);


//logout
router.get('/LogOut',userController.logOut)

// Shop page
router.get('/ShopPage', userListcontroller.LoadShopage);

// Product Details page
router.get('/productDetails/product/:productId/variant/:variantId',userMiddleware.isLogin, userListcontroller.loadProductDetails);


//Product cart page
router.get('/productCart',userMiddleware.isLogin,userListcontroller.loadProductCart);
router.post('/addToCart',userListcontroller.addToCart)
//cartQuantity find
router.get('/cartQuantity',userListcontroller.getQuantity)
router.post('/cartUpdate',userMiddleware.isLogin,userListcontroller.updateCart );
router.post('/productCart/remove',userMiddleware.isLogin,userListcontroller.removeCart)

//CheakOut page
router.get('/cheakOut',userMiddleware.isLogin,cheakoutController.loadCheakoutPage);

//cartPage breadcubs
router.get('/cartPage',userMiddleware.isLogin,cheakoutController.breadCrumbCart)

//userAccount
router.get('/myaccount',userMiddleware.isLogin,myaccountController.loadMyAccount);
//updateProfile
router.patch("/updateProfile",userMiddleware.isLogin,myaccountController.updateProfile);
//updatePassword
router.patch('/changePassword',userMiddleware.isLogin,myaccountController.updatePassword)

router.get('/address',userMiddleware.isLogin,myaccountController.loadaddress);
router.post('/addAddress',myaccountController.addAddress)

//editaddress
router.get('/myaddress/:id', myaccountController.getAddressById);
router.post('/editAddress', myaccountController.editAddress);

//deleteaddress
router.delete('/removeaddress/:id', myaccountController.removeAddress)

//userOrderAccout
router.get('/Userorders',userMiddleware.isLogin,myaccountController.loadOrderDetails);
//userOrderAccout cancel
router.post('/cancel-order/:orderId', myaccountController.orderCancel);
//userOrderAccout return
router.post('/return-order/:orderId', myaccountController.orderReturn)

//userAccount wallet
router.get('/wallet',userMiddleware.isLogin,myaccountController.loadWalletPage);
//userAccount wishlist
router.get('/wishlist',userMiddleware.isLogin,myaccountController.loadWishList);
router.post('/removeFromWishlist',userMiddleware.isLogin,myaccountController.removeWishList)

//order page
router.get("/order",userMiddleware.isLogin,userMiddleware.isLogin,orderController.loadOrderPage);
router.post("/place-order",userMiddleware.isLogin,orderController.orderSummory);

//retry payment
router.get('/retry-payment/:orderId',userMiddleware.isLogin,orderController.retryPayment)
router.post('/update-payment-status',userMiddleware.isLogin,orderController.updateStatus)

//keybord page
router.get('/keyboard',productsController.loadKeyboardPage);
router.get('/headSet',productsController.loadHeadsetPage);
router.get('/mouse',productsController.loadMousePage);
router.get('/controller',productsController.loadControllerPage)


//applyCoupon
router.post('/applyCoupon',userCouponController.applyCoupon);
router.get('/getCoupons',userCouponController.getCoupons);
//removeCoupon
router.post('/removeCoupon',userCouponController.removeCoupon);
router.get('/getCart',userCouponController.getCart)


//addtowishlist
router.post('/add-to-wishlist',myaccountController.addWishList);

router.get('/download-orders-pdf/:orderId',myaccountController.downloadOrderPdf)

router.get('/home2',userCouponController.loadHomePage)



module.exports = router;
