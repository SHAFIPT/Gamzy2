const User = require('../model/UserModel');
const Product = require("../model/productModel")
const Category = require("../model/catogoriesModel")
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
require('dotenv').config();
const verifyOtp = require('../model/otpVerification');
const { findById } = require('../model/productModel');


const successGoogleLogin = async(req,res)=>{
    try {
        console.log('ethitto')
        const name = req.user.name.givenName;
        const email = req.user.email;
        const user = await User.findOne({email}, {});
        if(user){
            req.session.user = user._id
            return res.redirect('/');
        }else{
          const createNewUser = await User.create({
            name : name,
            email : email,
          });
          req.session.user = createNewUser._id
          res.redirect('/')
        }

    } catch (error) {
        console.log(error);
    }
}

const failureGoogleLogin = async(req,res)=>{
    try {
        
        res.redirect('/')

    } catch (error) {
        console.log(error);
    }
}


const generateOTP = () => {
    return Math.floor(100000 + Math.random() * 900000).toString(); // Generates a 6-digit OTP
};



const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};
const loadhome = async (req, res) => {
    try {
        const userId = req.session.user;
        let user = null;
        let products = []; // Initialize products
        let moreProducts = []; // Initialize products for the second section
        let controllers = []; // Initialize controllers

        if (userId) {
            user = await User.findById(userId);
        }

        // Fetch products if user is logged in
        products = await Product.find({ is_Listed: true }).limit(5); // Adjust the query as needed

        // Fetch additional products for the second section
        moreProducts = await Product.find({ is_Listed: true }).skip(14).limit(5); // Skipping first 5 products

        // Find the category ID for "Controllers"
        const controllerCategory = await Category.findOne({ name: "CONTORLLER" });
        if (controllerCategory) {
            const controllerCategoryId = controllerCategory._id;

            // Fetch controllers from the "Controllers" category
            controllers = await Product.find({ 
                is_Listed: true, 
                productCategory: controllerCategoryId 
            }).limit(3); // Fetch 3 controllers for the blog section
        }

        res.render('home', { user, products, moreProducts, controllers, truncateDescription });
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadlogin = async (req, res) => {
    try {
        const name = req.session.userName || null; // Retrieve name from session if available
        console.log("Rendering login page");
        res.render('login', { name: name });
    } catch (error) {
        console.log(error);
    }
};

const logOut = async(req,res)=>{
    try {

        req.session.user = false
        res.redirect('/');
        
    } catch (error) {
        console.log(error);
    }
}


const loadsignUp = async (req, res) => {
    try {
        console.log('Rendering signUp page');
        res.render('signUp');
    } catch (error) {
        console.log(error);
    }
};

const insertSignUp = async (req, res) => {
    try {
        const { name, password, email, phonenumber } = req.body;

        console.log('Received signup data:', { name, password, email, phonenumber });

        // Check if the email already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email already exists' });
        }

        req.session.name = name ;
        req.session.password = password;
        req.session.email = email;
        req.session.phonenumber = phonenumber;

        
        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email_admin,
                pass: process.env.smtp_password
            }
        });
        const otp = generateOTP();
        console.log(otp)
        
        req.session.otp=otp
        console.log(req.session.otp)
        console.log(otp);

        const mailOptions = {
            from: process.env.email_admin,
            to: email,
            subject: 'Verify Your Email with OTP',
            text: `Your OTP for email verification is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP email sent successfully.');

          // Save OTP to the database
          const otpEntry = new verifyOtp({
            Email: email,
            otp: otp,
            createdAt: new Date() // Ensure the createdAt is a Date object
        });

        await otpEntry.save();
        console.log('OTP saved to the database successfully.');



        res.status(200).json({message:'otp send successfully'})
        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        const user = new User({
            name,
            password: hashedPassword,
            phonenumber,
            email,
            is_admin: 0,
            is_blocked: 0
        });

        console.log('Saving user to database...');
        const userData = await user.save();



        // if (userData) {
        //     console.log('User saved successfully:', userData);

        //     // Send OTP verification email
            // await sendOTPverificationEmail(email,req.session);

        //     // Redirect to verifyOTP page
        //     return res.status(200).json({message:'ready to get otp'})
        // } else {
        //     console.log('User registration failed');
        //     return res.status(500).json({message:'erron sign up '});
        // }
    } catch (error) {
        console.error('Error saving user:', error.message);
        res.status(200).json({message:'otp send successfully'})
        res.status(500).send('Internal Server Error');
    }
}; 

// const verifyLogin = async (req, res) => {
//     try {
//         const email = req.body.email;
//         const password = req.body.password;

//         const userData = await User.findOne({ email: email });

//         if (!userData) {
//             return res.status(500).json({ message: 'Email and password are incorrect' });
//         }

//         if (userData&&userData.is_blocked) {
//             return res.status(500).json({ message: 'The user is blocked' });
//         }else if(userData&&userData.is_blocked===false){
//             const verifyLogin = async (req, res) => {
//                 try {
//                     const email = req.body.email;
//                     const password = req.body.password;
            
//                     const userData = await User.findOne({ email: email });
            
//                     if (!userData) {
//                         return res.status(404).json({ message: 'Email and password are incorrect' });
//                     }
            
//                     if (userData.is_blocked) {
//                         return res.status(303).json({ message: 'The user is blocked' });
//                     }
            
//                     const passwordMatch = await bcrypt.compare(password, userData.password);
            
//                     if (passwordMatch) {
//                         req.session.userId = userData._id;
//                         return res.status(200).json({ message: 'Login successful' });
//                     } else {
//                         return res.status(500).json({ message: 'Email and password are incorrect' });
//                     }
//                 } catch (error) {
//                     console.error('Error during login:', error);
//                     return res.status(500).json({ message: 'Internal Server Error' });
//                 }
//             }
            
//         }
//     } catch (error) {
//         console.error('Error during login:', error);
//         return res.status(500).json({ message: 'Internal Server Error' });
//     }
// }
const verifyLogin = async (req, res) => {
    try {
        const { email, password } = req.body;

        const userData = await User.findOne({ email: email });

        if (!userData) {
            return res.status(404).json({ message: 'Email and password are incorrect' });
        }
 
        if (userData.is_blocked) {
            return res.status(403).json({ message: 'The user is blocked' });
        }

        const passwordMatch = await bcrypt.compare(password, userData.password);

        if (passwordMatch) {
            req.session.user = userData._id;
            req.session.userName = userData.name; // Store the user's name in the session

            console.log('this is session userId',req.session.user)
            return res.status(200).json({ message: 'Login successful' });
        } else {
            return res.status(404).json({ message: 'Email and password are incorrect' });
        }
    } catch (error) {
        console.error('Error during login:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
}


const getOTPPage = async (req, res) => {
    try {
        console.log("Rendering verify OTP page");
        const email = req.session.email;
        res.render('verifyOTP', {email : email}); // Assuming 'verifyOTP' is the name of your view file
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};
const verifyOTP = async (req, res) => {
    try {
        const { otp } = req.body;
        console.log('Received OTP:', otp);
        console.log('Session OTP:', req.session.otp);

        if (req.session.otp === otp) {
            console.log('OTP verified successfully');
            await verifyOtp.deleteOne({ Email: req.session.email, otp: otp });
            console.log('OTP entry deleted from database');
            res.status(200).json({ message: "Signup successfully" });
        } else {
            console.log('OTP is incorrect');
            res.status(400).json({ message: 'OTP is incorrect' });
        }
    } catch (error) {
        console.log('Error during OTP verification:', error);
        res.status(500).send('Internal Server Error');
    }
};

const resendOTP = async (req, res) => {
    try {
        const { email } = req.body;
        const otp = generateOTP();
        
        req.session.otp = otp;

        const transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
                user: process.env.email_admin,
                pass: process.env.smtp_password
            }
        });

        const mailOptions = {
            from: process.env.email_admin,
            to: email,
            subject: 'Resend OTP for Email Verification',
            text: `Your OTP for email verification is: ${otp}`
        };

        await transporter.sendMail(mailOptions);
        console.log('OTP email resent successfully.');
        res.status(200).json({ success: true, message: 'OTP resent successfully' });
    } catch (error) {
        console.error('Error resending OTP:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

const forgotPassword = async (req,res) =>{
    try {

        res.render('resetPassword')
        
    } catch (error) {
        console.log(error)
    }
};

const updatePassword = async (req,res) =>{
    try {

        const {email , password} = req.body;
        console.log('This is my email:',email);
        console.log('This is my password:',password);

        const user = await User.findOne({email})

        if (!user) {
            return res.status(404).json({ success: false, message: 'Email not found' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);


         // Update the password
         user.password = hashedPassword;

         await user.save();


         res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error resetPassword...!:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}



module.exports = {
    loadhome,
    loadlogin,
    loadsignUp,
    insertSignUp,
    getOTPPage,
    verifyOTP,
    verifyLogin,
    resendOTP,
    successGoogleLogin,
    failureGoogleLogin,
    logOut,
    forgotPassword,
    updatePassword
};
 