const Category = require('../model/catogoriesModel');
const Product = require('../model/productModel');

const truncateDescription = (description, maxLength) => {
    if (description.length > maxLength) {
        return description.substring(0, maxLength) + '...';
    }
    return description;
};


const loadKeyboardPage = async (req, res) => {
    try {
      const { sort, subcategory, price_from, price_to ,page = 1, limit = 6 } = req.query;

      const pageNumber = parseInt(page, 10);
      const limitNumber = parseInt(limit, 10);


  
      const KeyboardCategory = await Category.findOne({ name: "KEYBOARD", is_listed: true });
  
      if (!KeyboardCategory) {
        return res.status(404).send("The KeyboardCategory is not found");
      }
  
      const filter = { productCategory: KeyboardCategory._id, is_Listed: true };
      
      if (subcategory) {
        filter.subCategory = subcategory;
      }
  
      if (price_from && price_to) {
        filter.price = { $gte: parseInt(price_from), $lte: parseInt(price_to) };
      }
  
      let sortOption = {};
      if (sort === "asc") {
        sortOption = { productname: 1 };
      } else if (sort === "desc") {
        sortOption = { productname: -1 };
      }
  
      const products = await Product.find(filter)
        .sort(sortOption)
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber)
        .populate('variants')
        .populate('productCategory');

         // Count total products for pagination
         const totalProducts = await Product.countDocuments(filter);
         const totalPages = Math.ceil(totalProducts / limitNumber);


      const subcategories = await Product.distinct('subCategory', { productCategory: KeyboardCategory._id });
  
    //   res.render('KeyboardPage', { products, truncateDescription, subcategories, sort, subcategory, price_from, price_to , });

      res.render('KeyboardPage', {
        products,
        subcategories,
        price_from,
        price_to,
        sort,
        subcategory,
        currentPage: pageNumber,
        totalPages,
        truncateDescription
    });


    } catch (error) {
      console.error(error);
      res.status(500).send('Internal Server Error');
    }
  };

  const loadHeadsetPage = async (req,res) => {
    try {

        const { sort, subcategory, price_from, price_to } = req.query;

        const category = await Category.findOne({name : "HEADSET" , is_listed : true})

        if(!category){
            return res.status(404).send("category is not found....!")
        }

        const filter = { productCategory: category._id, is_Listed: true };

        if (subcategory) {
            filter.subCategory = subcategory;
          }
      
          if (price_from && price_to) {
            filter.price = { $gte: parseInt(price_from), $lte: parseInt(price_to) };
          }
      
          let sortOption = {};
          if (sort === "asc") {
            sortOption = { productname: 1 };
          } else if (sort === "desc") {
            sortOption = { productname: -1 };
          }
      
          const products = await Product.find(filter).sort(sortOption).populate('variants').populate('productCategory');
          const subcategories = await Product.distinct('subCategory', { productCategory:  category ._id });
      
          res.render('headsetPage', { products, truncateDescription, subcategories, sort, subcategory, price_from, price_to });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
  }
  

const loadMousePage = async (req,res)=>{
    try {

        const { sort, subcategory, price_from, price_to } = req.query;

        const category = await Category.findOne({name : "MOUSE" , is_listed : true});

        if(!category){
            return res.status(404).send("category is not found....!")
        }

        const filter = { productCategory: category._id, is_Listed: true };

        if (subcategory) {
            filter.subCategory = subcategory;
          }
      
          if (price_from && price_to) {
            filter.price = { $gte: parseInt(price_from), $lte: parseInt(price_to) };
          }
      
          let sortOption = {};
          if (sort === "asc") {
            sortOption = { productname: 1 };
          } else if (sort === "desc") {
            sortOption = { productname: -1 };
          }
      
          const products = await Product.find(filter).sort(sortOption).populate('variants').populate('productCategory');
          const subcategories = await Product.distinct('subCategory', { productCategory:  category ._id });
      
          res.render('MousePage', { products, truncateDescription, subcategories, sort, subcategory, price_from, price_to });


        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
}

const loadControllerPage = async (req,res) =>{
    try {

        const { sort, subcategory, price_from, price_to } = req.query;

        const category = await Category.findOne({name : "CONTORLLER" , is_listed : true});

        if(!category){
            return res.status(404).send("category is not found....!")
        }

        const filter = { productCategory: category._id, is_Listed: true };

        if (subcategory) {
            filter.subCategory = subcategory;
          }
      
          if (price_from && price_to) {
            filter.price = { $gte: parseInt(price_from), $lte: parseInt(price_to) };
          }
      
          let sortOption = {};
          if (sort === "asc") {
            sortOption = { productname: 1 };
          } else if (sort === "desc") {
            sortOption = { productname: -1 };
          }
      
          const products = await Product.find(filter).sort(sortOption).populate('variants').populate('productCategory');
          const subcategories = await Product.distinct('subCategory', { productCategory:  category ._id });
      
          res.render('ControllerPage', { products, truncateDescription, subcategories, sort, subcategory, price_from, price_to });


        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error'); 
    }
}

module.exports = {
    loadKeyboardPage,
    loadHeadsetPage,
    loadMousePage,
    loadControllerPage 
}