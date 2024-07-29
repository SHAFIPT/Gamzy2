const express = require('express')
const admin_route = express();
const path = require('path')
const Admincontroller = require('../Controllers/Admincontroller')
const Productcontroller = require('../Controllers/ProductController')
const nocache = require('nocache') 
const upload = require('../middlewares/multer')
const checkBlockedStatus = require('../middlewares/CheakBlockStatus')
const auth = require('../middlewares/adminmiddleware');
 
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
 

module.exports = admin_route;
