const Product = require('../model/productModel')
const Category = require('../model/catogoriesModel');
const Cart = require('../model/cartShema');
const  Order = require("../model/ordreModel");
const  Offer = require('../model/offerModal')


const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};

const LoadShopage = async (req, res) => {
    try {
        // Extract query parameters
        const { price_from, price_to, category, subcategory, sort, search, brand,  page = 1, limit = 9 } = req.query;
        const pageNumber = parseInt(page, 10);
        const limitNumber = parseInt(limit, 10);

        // Build the query object for filtering products
        let query = { is_Listed: true };

        // Validate and parse price range
        const priceFrom = parseFloat(price_from);
        const priceTo = parseFloat(price_to);
        if (!isNaN(priceFrom) && !isNaN(priceTo)) {
            query['price'] = { $gte: priceFrom, $lte: priceTo };
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

        if (brand) {
            query.brand = brand;
        }

      // Build sorting object
      let sortOption = {};
      if (sort === 'asc') {
          sortOption['price'] = 1; // Low to High
      } else if (sort === 'desc') {
          sortOption['price'] = -1; // High to Low
      } else if (sort === 'name_asc') {
          sortOption['productname'] = 1; // A to Z
      } else if (sort === 'name_desc') {
          sortOption['productname'] = -1; // Z to A
      } else {
          sortOption['price'] = 1; // Default to Low to High
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
        const brands = await Product.distinct('brand'); // Get unique brands from products
         // Fetch active offers
         const offers = await Offer.find({ active: true });


         // Process offers and select the highest discount for each product
         products.forEach(product => {
            let highestDiscount = 0;
            offers.forEach(offer => {
                if (offer.applicableToProducts.includes(product._id) || offer.applicableToCategories.includes(product.productCategory._id)) {
                    if (offer.discount > highestDiscount) {
                        highestDiscount = offer.discount;
                    }
                }
            });
            product.highestDiscount = highestDiscount;
            console.log("this is the highestDiscount :",highestDiscount);
            
            product.discountedPrice = product.price - (product.price * highestDiscount / 100);
            
            console.log("This is product discountedPrice :",product.discountedPrice);
            
        });



        //  console.log("this my offers" , offers);
         

        res.render('Shopage', {
            products,
            categories,
            subcategories,
            brands,
            price_from,
            price_to,
            sort,
            category,
            subcategory,
            currentPage: pageNumber,
            totalPages,
            brand,
            search,
            offers, // Pass offers to the template
            truncateDescription
        });

    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const loadProductDetails = async (req, res) => {
    try {
        const productId = req.params.productId;
        const variantId = req.params.variantId;

        const product = await Product.findById(productId).populate('variants').populate('productCategory');
        const offers = await Offer.find({ active: true });

        let variant = product.variants.find((variant) => variant._id == variantId);

        if (!variant) {
            return res.status(404).send('Variant is not found...!');
        }

        const category = product.productCategory;

        if (!category) {
            return res.status(404).send('category is not found...!');
        }

        // Calculate the highest discount
        let highestDiscount = 0;
        offers.forEach(offer => {
            if (offer.applicableToProducts.includes(product._id) || offer.applicableToCategories.includes(product.productCategory._id)) {
                if (offer.discount > highestDiscount) {
                    highestDiscount = offer.discount;
                }
            }
        });

        console.log("This is the highest discount:", highestDiscount);

        // Calculate the discounted price
        const discountedPrice = product.price - (product.price * highestDiscount / 100);

        console.log("This is the discounted price:", discountedPrice);

        res.render('productDetails', { 
            product, 
            variant, 
            category, 
            discount: highestDiscount, 
            discountedPrice 
        });

    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
};

const loadProductCart = async (req, res) => {
    try {
        const userId = req.session.user;

        const cart = await Cart.find({ userId }).populate({
            path: 'products.productId',
            populate: [
                { path: 'variants' },
                { path: 'productCategory' }
            ]
        });

        // Fetch all active offers
        const offers = await Offer.find({ active: true });

        // Calculate discounted prices for each product in the cart
        cart.forEach(item => {
            item.products.forEach(productInCart => {
                const product = productInCart.productId;
                let highestDiscount = 0;

                // Check if any offers apply to the product or its category
                offers.forEach(offer => {
                    if (offer.applicableToProducts.includes(product._id) || 
                        offer.applicableToCategories.includes(product.productCategory._id)) {
                        highestDiscount = Math.max(highestDiscount, offer.discount);
                    }
                });

                // Calculate discounted price
                const discountedPrice = product.price - (product.price * highestDiscount / 100);
                
                productInCart.discountedPrice = discountedPrice;
                productInCart.discount = highestDiscount;

                console.log(`Product: ${product.name}, Original Price: ${product.price}, Discount: ${highestDiscount}%, Discounted Price: ${discountedPrice}`);
            });
        });

        res.render('userCart', { cart });
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


        const { productId, variantId, quantity , price} = req.body;

        console.log("This is the price for productDetails page ",price );
        console.log("This is the productId for productDetails page ",productId );
        console.log("This is the variantId for productDetails page ",variantId );
        // console.log("This is the price for productDetails page ",price );
        
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
            cart.products[productIndex].price = price; // Update the price
        } else {
            // If the product with the variant doesn't exist in the cart, add it
            cart.products.push({ productId, variantId, quantity: parseInt(quantity) , price: price });
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
        const { productId, variantId, quantity  } = req.body;
        

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


const getQuantity = async(req,res)=>{
    try {
        if (!req.session.user) {
            return res.status(401).json({ error: 'User not logged in' });
        }

        const userId = req.session.user;
        const cart = await Cart.findOne({ userId });

        if (!cart) {
            return res.json({ quantity: 0 });
        }

        const quantity = cart.products.reduce((sum, product) => sum + product.quantity, 0);

        res.json({ quantity });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    LoadShopage,
    loadProductDetails,
    loadProductCart,
    addToCart,
    updateCart,
    removeCart,
    getQuantity
}