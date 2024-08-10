const express = require('express')
const admin_route = express();
const path = require('path')
const Admincontroller = require('../Controllers/Admincontroller')
const Productcontroller = require('../Controllers/ProductController');
const adminOrderController = require('../Controllers/AdminOrderController');
const adminCouponController = require("../Controllers/AdmincouponController");
const adminOfferController = require('../Controllers/AdminOfferController');
const adminSaleController = require('../Controllers/AdminSalesController')
const nocache = require('nocache') 
const upload = require('../middlewares/multer')
const checkBlockedStatus = require('../middlewares/CheakBlockStatus')
const auth = require('../middlewares/adminmiddleware');
const methodOverride = require('method-override');

// In your Express app setup
admin_route.use(methodOverride('_method'));
 
admin_route.use(nocache());

const session = require("express-session");
const config = require("../config/confisg");
const multer = require('multer');

admin_route.use(session({ secret: config.sessionSecret,resave: false, saveUninitialized: false  }));

admin_route.use(checkBlockedStatus)

admin_route.set('view engine', 'ejs'); 
admin_route.set('views', './view/admin'); 

// admin_route.use('/static', express.static(path.join(__dirname, '..', 'public', 'uploads')));

admin_route.use(express.static('public'))
  
// admin_route.get('/',Admincontroller.verifyLogin)
admin_route.get('/',auth.isLogout,(req,res)=>{res.redirect('/admin/login')})

//LoginPage
admin_route.get('/login',auth.isLogout,Admincontroller.loadLogin);
admin_route.post('/login',Admincontroller.verifyLogin);

//LoginHome
admin_route.get('/home',auth.isLogin,Admincontroller.LoadHome);
admin_route.get('/userManagment',auth.isLogin,Admincontroller.LoadUserManagment);

//LoadCategory
admin_route.get('/Category',auth.isLogin,Admincontroller.LoadCategoryManagement);

//ListUnlistCategory
admin_route.post('/listUnlistCategory',auth.isLogin,Admincontroller.ListUnlistCategory);

//editCategory
admin_route.get('/editCategory/:id', auth.isLogin, Admincontroller.loadEditCategory);
admin_route.post('/editCategory', auth.isLogin, Admincontroller.updateCategory);

//addCategory
admin_route.get('/addCatogory',auth.isLogin,Admincontroller.LoadCategory)
admin_route.post('/addCatogory',auth.isLogin,Admincontroller.addCategory) 

//LoadProduct
admin_route.get('/Products', auth.isLogin,Admincontroller.LoadProduct)

//AddProduct
admin_route.get('/addProduct',auth.isLogin,Productcontroller.LoadProduct )
admin_route.post('/add-product', upload.any(), Productcontroller.addProduct);
 
//editproduct
admin_route.get('/edit-product/:id',auth.isLogin,Productcontroller.LoadEditproduct)
admin_route.post('/updateProduct',upload.any(),Productcontroller.UpdateProduct);

//ListUnlistProduct
admin_route.post('/listUnlistProduct',auth.isLogin,Productcontroller.ListUnlistProduct)

//LoadVarient
admin_route.get('/VarientList/:id',auth.isLogin,Productcontroller.LoadVarient)

//AddVarient
admin_route.get('/addVarient',auth.isLogin,Productcontroller.LoadAddvarient)
admin_route.post('/add-Variant/:id',upload.any(),Productcontroller.AddVarient)

//EditVarient
admin_route.get('/edit-Varient/:id',auth.isLogin,Productcontroller.loadEditVarinet);
admin_route.post('/updateVariant/:id',upload.any(),Productcontroller.editVarient);

admin_route.post('/logout',auth.isLogin,Admincontroller.logout)
admin_route.post('/block-user', Admincontroller.blockuser);

//orderslist
admin_route.get('/OrderList',auth.isLogin,adminOrderController.loadOrderPage);
admin_route.get('/viewOrder/:OrderId',auth.isLogin,adminOrderController.loadViewPage);
admin_route.post('/update-status',adminOrderController.updateStatus);

//couponManagement
admin_route.get('/couponManage',adminCouponController.loadCouponPage);
admin_route.get('/addCoupon',adminCouponController.addCoupon);
admin_route.post('/addCoupon',adminCouponController.addCouponPage);
//editCoupon
admin_route.get('/editCoupon/:id',adminCouponController.loadEditPage);
admin_route.post('/editCoupon/:id',adminCouponController.updateCoupon);
//deleteCoupon
admin_route.delete('/deleteCoupon/:id',adminCouponController.removeCoupon)


//OfferManagement
admin_route.get('/offerManage',adminOfferController.loadOfferPage);
admin_route.get('/addOffer',adminOfferController.addOffer);
admin_route.post('/addOffer',adminOfferController.addOfferDetails)
admin_route.post('/toggleOfferStatus/:id',adminOfferController.offerStatus)
admin_route.delete('/deleteOffer/:id',adminOfferController.deleteOffer);
//editOffer
admin_route.get('/editOffer/:id',adminOfferController.loadOfferEdit)
admin_route.put('/editOffer/:id',adminOfferController.editOffer)

admin_route.get('/getProducts',adminOfferController.getProducts);
admin_route.get('/getCategories',adminOfferController.getCategories)

//sales Report
admin_route.get('/salesReport',adminSaleController.loadSalesReport)
 

module.exports = admin_route;
