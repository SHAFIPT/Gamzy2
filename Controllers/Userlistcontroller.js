const Product = require('../model/productModel')
const Category = require('../model/catogoriesModel');
const Cart = require('../model/cartShema')


const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};

const LoadShopage = async (req, res) => {
    try {
        // Extract query parameters
        const { price_from, price_to, category, subcategory, sort , search , page = 1, limit = 6 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Build the query object for filtering products
        let query = { is_Listed: true };

        if (price_from && price_to) {
            query['price'] = { $gte: parseFloat(price_from), $lte: parseFloat(price_to) };
        }

        if (search) {
            query.productname = { $regex: search, $options: 'i' }; // Case-insensitive search
        }

        if (category) {
            query.productCategory = category;
        }

        if (subcategory) {
            query.subCategory = subcategory;
        }

        // Build sorting object
        let sortOption = {};
        if (sort === 'asc') {
            sortOption['productname'] = 1; // A to Z
        } else if (sort === 'desc') {
            sortOption['productname'] = -1; // Z to A
        } else {
            sortOption['productname'] = 1; // Default sorting
        }

        // Fetch products based on the query
        const products = await Product.find(query)
        .sort(sortOption)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate('variants')
        .populate('productCategory');

         // Count total products for pagination
         const totalProducts = await Product.countDocuments(query);
         const totalPages = Math.ceil(totalProducts / limitNumber);

        // Fetch all categories and subcategories
        const categories = await Category.find({ is_listed: true });
        const subcategories = await Product.distinct('subCategory'); // Get unique subcategories from products

        res.render('Shopage', {
            products,
            categories,
            subcategories,
            price_from,
            price_to,
            sort,
            category,
            subcategory,
            currentPage: pageNumber,
            totalPages,
            search,
            truncateDescription
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}
const loadProductDetails = async(req,res) =>{
    try {

        
        const productId = req.params.productId;
        const variantId = req.params.variantId;

        // console.log('This is shop product :', productId);
        // console.log('This is shop varient :', variantId);
        
        const product = await Product.findById(productId).populate('variants').populate('productCategory');

        // console.log('This is my shop product',product);

        let variant = product.variants.find((variant)=> variant._id == variantId);

        // console.log('This is my variant',variant);

        if(!variant){
            return res.status(404).send('Variant is not found...!');
        }

        const category = product.productCategory;

        // console.log('This is my category',category);
        
        if(!category){
            return res.status(404).send('category is not found...!');
        }

        res.render('productDetails' , {product , variant ,category})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const loadProductCart = async(req , res) =>{
  
    try { 

            const userId = req.session.user;

            // console.log('The user is here : ',userId);

            const cart = await Cart.find({ userId }).populate({
                path: 'products.productId',
                populate: { path: 'variants' }
            })


            // console.log('the cart is here :',cart);

            res.render('userCart', { cart }); // Render cart.ejs template with cart data


   
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
const addToCart = async (req, res) => {
    try {

        if (!req.session.user) {
            return res.status(401).json({ error: 'Please log in to add products to your cart.' });
        }


        const { productId, variantId, quantity } = req.body;
        const userId = req.session.user; // Assuming you have authenticated user stored in req.session.user

        // Fetch the product and variant to check available stock
        const product = await Product.findById(productId);
        const variant = product.variants.id(variantId);

        if (!variant) {
            return res.status(404).json({ error: 'Variant not found' });
        }

        const availableStock = variant.quantity;

        // Check if the requested quantity exceeds the available stock
        if (quantity > availableStock) {
            return res.status(400).json({ error: 'Requested quantity exceeds available stock' });
        }

        // Check if the cart already exists for the user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            // If cart doesn't exist for the user, create a new one
            cart = new Cart({ userId, products: [] });
        }

        // Check if the product with the specific variant is already in the cart
        const productIndex = cart.products.findIndex(p =>
            p.productId.toString() === productId && p.variantId.toString() === variantId
        );

        if (productIndex !== -1) {
            // If the product with the variant already exists, update its quantity
            const newQuantity = cart.products[productIndex].quantity + parseInt(quantity);

            if (newQuantity > availableStock) {
                return res.status(400).json({ error: 'Total quantity in cart exceeds available stock' });
            }

            cart.products[productIndex].quantity = newQuantity;
        } else {
            // If the product with the variant doesn't exist in the cart, add it
            cart.products.push({ productId, variantId, quantity: parseInt(quantity) });
        }

        // Save the cart to the database
        await cart.save();

        res.status(200).json({ message: 'Product added to cart successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};
const updateCart = async (req, res) => {
    try {
        const { productId, variantId, quantity } = req.body;
        const userId = req.session.user;

        // Fetch cart document for the user
        let cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }

        // Find the product variant in the cart's products array
        const product = cart.products.find(p =>
            p.productId.toString() === productId && p.variantId.toString() === variantId
        );

        if (!product) {
            return res.status(404).json({ error: 'Product variant not found in cart' });
        }

        // Check if the requested quantity exceeds the available quantity
        const maxQuantity = Math.min(5, product.availableQuantity);

        if (quantity > maxQuantity) {
            return res.status(400).json({ message: `Quantity cannot exceed ${maxQuantity}` });
        }

        // Update the product quantity in the cart
        product.quantity = parseInt(quantity);

        await cart.save();
        res.status(200).json({ message: 'Cart updated successfully' });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};


const removeCart = async (req,res)=>{
    try {
        // console.log('this is remove cart')
        const {data} = req.body; 
        // console.log(req.body.data)
        // console.log('This is remove cart ProductId:',data.productId);
        // console.log('This is remove cart variantId:',data.variantId);

        const userId = req.session.user;

        await Cart.updateOne( 
            {userId : userId},
            { $pull: { products: { productId: data.productId, variantId: data.variantId }}}
        )


        res.status(200).json({ message: 'Product removed from cart successfully' });
    } catch (error) {
        console.error('Error removing product from cart:', error);
        res.status(500).json({ message: 'Failed to remove product from cart' });
    }
}


module.exports = {
    LoadShopage,
    loadProductDetails,
    loadProductCart,
    addToCart,
    updateCart,
    removeCart,
}