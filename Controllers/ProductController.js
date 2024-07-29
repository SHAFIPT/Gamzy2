const Product = require('../model/productModel')
const Category = require('../model/catogoriesModel')
const path = require('path')
const mongoose = require('mongoose');


const LoadProduct = async (req,res)=>{
    try {
        
        const categories = await Category.find({is_listed : true});
        res.render('addProduct',{ categories : categories})

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


async function addProduct(req, res) {
    try {

        const { name, description, category, price, quantity , color} = req.body;

        let images = []
        req.files.forEach((file)=>{
            images.push(file.filename)
        })

        const getCategory = await Category.findOne({ name : category})

        if(!getCategory){
            return  res.status(404).json({ message: 'Category is not found'});
        }

        const newProduct = new Product({
            productname: name,
            productDescription: description,
            productCategory: getCategory._id,
            price,
            is_Listed: true,
            variants : [{
                color,
                quantity,
                images
            }]
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error adding product:', error);
        res.status(500).json({ message: 'Error adding product', error });
    }
}

    


const LoadEditproduct = async (req,res)=>{
    try {
        
        const productId = req.params.id; // Get product ID from request params
        // Fetch the product details by ID
        const product = await Product.findById(productId).populate('productCategory').populate('variants'); // Assuming 'productCategory' is a reference to Category

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        // Fetch all categories to populate the dropdown
        const categories = await Category.find({ is_listed: true }); // Adjust query based on your schema

        // Render the editproduct view with product details and categories
        res.render('editproduct', { product: product, categories: categories ,  path: path });

vv
    } catch (error) {
        console.error('Error Edit product:', error);
        res.status(500).json({ message: 'Error Edit product', error });
    }
}

const UpdateProduct = async (req, res) => {
    try {
        const productId = req.body.productId;
        // console.log(productId);
        // console.log('hellow');
        const { name, description, category, price, quantity } = req.body;

        // console.log(req.files)


        const getCategory = await Category.findOne({ name: category });

        if (!getCategory) {
            return res.status(404).json({ message: 'Category not found' });
        }

        const product = await Product.findById(productId)


        product.productname = name
        product.productDescription = description
        product.productCategory = getCategory._id
        product.price = price
        // product.variants.quantity = quantity

            // Ensure variants array and update quantity
            if (product.variants && product.variants.length > 0) {
                product.variants[0].quantity = quantity;
            }
    

        req.files.forEach((file)=>{
           if(file.fieldname === 'image1'){
            product.variants[0].images[0] = file.filename
           }else if(file.fieldname === 'image2'){
            product.variants[0].images[1] = file.filename
           }else if(file.fieldname === 'image3'){
            product.variants[0].images[2] = file.filename
           }else{
            product.variants[0].images[3] = file.filename
           }

        })


        const updatedProduct = await product.save()

        if (!updatedProduct) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.json({ message: 'Product updated successfully', product: updatedProduct });
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ message: 'Error updating product', error });
    }
}


const ListUnlistProduct = async(req,res)=>{
    try {
        
        const { id } = req.body;
        const product = await Product.findById(id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'product not found' });
        }

        product.is_Listed = !product.is_Listed;
        await product.save();

        res.status(200).json({ success: true, message: 'product status updated successfully' });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const LoadVarient = async (req,res) =>{
    try {
        const productId = req.params.id;
        
        // Use findOne to get a single document based on productId
        const product = await Product.findById(productId);
        //  console.log('this is my prorrodct', product);
        if (!product) {
            // Handle case where product with given ID is not found
            return res.status(404).send('Product not found');
        }

        // Render the view with an array containing the single product
        res.render('VarientManagment', {product : product});

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}


const LoadAddvarient = async (req, res) => {
    try {
        // console.log('Received request for adding variant');
        const productId = req.query.id;
        // console.log('Received product ID:', productId);

        if (!productId) {
            console.log('Product ID is missing');
            return res.status(400).json({ message: 'Product ID is required' });
        }

        const product = await Product.findOne({ _id: productId });

        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ message: 'Product not found' });
        }

        // console.log('Product found:', product);
        res.render('AddVarient', { product : product});
    } catch (error) {
        console.log('Error:', error);
        res.status(500).send('Internal Server Error');
    }
};

    const AddVarient = async (req,res)=>{
        try {
            console.log('this is add variant method')
            const { color, quantity } = req.body;
            const productId=req.params.id
            // console.log('color is not found',color);
            // console.log('quantity is not found',quantity);
            console.log(productId)
            if (!color || !quantity) {
                return res.status(400).json({ message: 'Color and quantity are required' });
            }
    
            let images = [];
            if (req.files) {
                req.files.forEach((file) => {
                    images.push(file.filename);
                });
            }
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({ message: 'Product not found' });
            }
    
            product.variants.push({
                color,
                quantity,
                images
            });
    
            await product.save();
    
           return  res.status(200).json({ message: 'Variant added successfully' });
        } catch (error) {
            console.error('Error adding Variant:', error);
            res.status(500).json({ message: 'Error adding Variant', error });
        }
    };

    const loadEditVarinet = async (req, res) => {
        try {
            const variantId = req.params.id;
            const product = await Product.findOne({ 'variants._id': variantId });
            // console.log('this is the fistproduc :',product);
            if (!product) {
                return res.status(404).send('Variant not found');
            }
    
            const variant = product.variants.id(variantId);
            // console.log('My variant is here :',variant);
            
            res.render('EditVarient', { variant, product });
        } catch (error) {
            console.log(error);
            res.status(500).send('Internal Server Error');
        }
    };

    const editVarient = async (req, res) => {
        try {
            const variantId = req.params.id;
            const { color, quantity } = req.body;
            console.log('This is the color:', color);
            console.log('This is the quantity:', quantity);
    
            // Find the product containing the variant
            const product = await Product.findOne({ 'variants._id': variantId });
            if (!product) {
                return res.status(404).send('Variant not found');
            }
    
            // Find the variant by ID within the product
            const variant = product.variants.id(variantId);
            console.log('This is my Backend variant Id:', variant);
    
            // Update the color and quantity fields
            variant.color = color;
            variant.quantity = quantity;
    
            // Update the images if new files are uploaded
            req.files.forEach((file) => {
                if (file.fieldname === 'image0') {
                    variant.images[0] = file.filename;
                } else if (file.fieldname === 'image1') {
                    variant.images[1] = file.filename;
                } else if (file.fieldname === 'image2') {
                    variant.images[2] = file.filename;
                } else if (file.fieldname === 'image3') {
                    variant.images[3] = file.filename;
                }
            });
    
            // Save the updated product
            await product.save();
    
            res.status(200).json({ message: 'Variant updated successfully' });
        } catch (error) {
            console.error('Error updating Variant:', error);
            res.status(500).json({ message: 'Error updating Variant', error });
        }
    };
    

module.exports = {
    addProduct,
    LoadProduct, 
    LoadEditproduct,
    UpdateProduct,
    ListUnlistProduct,
    LoadVarient,
    LoadAddvarient,
    AddVarient,
    loadEditVarinet,
    editVarient
}