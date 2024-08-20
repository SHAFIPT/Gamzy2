const User = require('../model/UserModel')
const Category = require('../model/catogoriesModel')
const Product = require('../model/productModel')
const path = require('path')
require('dotenv').config();

const mongoose = require('mongoose');
const { render } = require('../routers/adminRoute');
const { json } = require('express');


const loadLogin = async (req, res) => {
    try {
        res.render('login');
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const verifyLogin = async (req, res) => {
    try {
        const email = process.env.Email; 
        const password = process.env.Password;

        if (req.body.email === email && req.body.password === password) {
            req.session.admin = email;
            res.status(200).json({ message: 'Admin logged in successfully' });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const LoadHome = async (req,res)=>{
    try {
        
        res.render('adminhome')

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const LoadUserManagment = async (req,res)=>{
    try {
        
        let search = '';
        if(req.query.search){
            search = req.query.search;
        }
        const page = parseInt(req.query.page) || 1 ;
        const limit = 4 ;
        const skip = (page - 1)*limit;

        const userData = await User.find({
            is_admin: { $ne: 1 },
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { phonenumber: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        }).skip(skip).limit(limit); 

        const totalUsers = await User.countDocuments({
            is_admin: { $ne: 1 },
            $or: [
                { name: { $regex: '.*' + search + '.*', $options: 'i' } },
                { email: { $regex: '.*' + search + '.*', $options: 'i' } },
                { phonenumber: { $regex: '.*' + search + '.*', $options: 'i' } }
            ]
        });

        const totalPages = Math.ceil(totalUsers / limit);

        res.render('userManagment',{users : userData ,currentPage : page , totalPages: Math.ceil(totalUsers / limit)});

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}


const LoadCategoryManagement = async (req, res) => {
    try {

        const page = parseInt(req.query.page) || 1;
        const limit = 4;
        const skip = (page - 1) * limit;

        const categories = await Category.find().skip(skip).limit(limit);
        const totalCategories = await Category.countDocuments();

        res.render('categoryList', { categories , currentPage: page,
            totalPages: Math.ceil(totalCategories / limit), }); 
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
};

const LoadCategory = async (req,res) =>{
    try {
        
        res.render('addCategory')

    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}

const ListUnlistCategory = async (req,res) => {
    try {
        const { id } = req.body;
        const category = await Category.findById(id);
        if (!category) {
            return res.status(404).json({ success: false, message: 'Category not found' });
        }

        category.is_listed = !category.is_listed;
        await category.save();

        res.status(200).json({ success: true, message: 'Category status updated successfully' });
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }
}
const addCategory = async (req, res) => {
    try {
        const { name, description } = req.body;

        const exists = await Category.findOne({ name });

        if (exists) {
            return res.status(400).json({ message: 'Name already exists!' });
        } else {
            const newCategory = new Category({
                name,
                description,
            });
            await newCategory.save();

            return res.status(200).json({ message: 'Category added successfully!' });
        }
    } catch (error) {
        res.status(500).json({ message: 'Internal Server Error' });
    }
};

const loadEditCategory = async (req, res) => {
    try {
        const categoryId = req.params.id;
        const category = await Category.findById({_id : categoryId});
        res.render('editCategory', {category});
         
    } catch (error) {
        res.status(500).send('Internal Server Error');
    }                                                                                                                                                                                                                                                                                                                                                                                                                                                                              
};

const updateCategory = async (req, res) => {
    try {
      
        const {id , name, description } = req.body;
        const updatedCategory = await Category.findByIdAndUpdate(id, { name, description }, { new: true });
        
        res.redirect('/admin/Category')
    } catch (error) { 
        console.error('Error updating category:', error);
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
};
const logout = async (req,res) =>{
    try {
        
        req.session.admin = null ;
        res.redirect('/admin/login')

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}
const { ObjectId } = mongoose.Types;

async function blockuser(req, res) {
    try {
        const userId = req.body.userId;
        const block = req.body.block;

        if (!ObjectId.isValid(userId)) {
            console.error(`Invalid userId: ${userId}`);
            return res.status(400).json({ success: false, message: 'Invalid user ID' });
        }

        const result = await User.updateOne({ _id: new ObjectId(userId) }, { $set: { is_blocked: block } });

        res.json({ success: true, message: `User ${block ? 'blocked' : 'unblocked'} successfully` });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Internal Server Error' });
    }
}

    const LoadProduct = async (req,res)=>{
        try {
            
            const products = await Product.find().populate('productCategory');
            res.render('productList' , { products: products })

        } catch (error) {

        res.status(500).send('Internal Server Error');
        }
    }

 
module.exports =  {
    loadLogin,
    verifyLogin,
    LoadHome,
    LoadUserManagment,
    logout,
    blockuser,
    LoadCategoryManagement,
    loadEditCategory,
    updateCategory,
    LoadCategory,
    addCategory,
    ListUnlistCategory,
    LoadProduct,
} 