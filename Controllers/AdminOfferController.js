const Product = require('../model/productModel')
const Category = require('../model/catogoriesModel')
const Offer = require('../model/offerModal');
const mongoose = require('mongoose')

const loadOfferPage = async (req,res) =>{
    try {

        const offers = await Offer.find().lean(); // Use lean() for better performance

        res.render('ManageOffer', {offers})
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const addOffer = async (req,res) =>{
    try {

        res.render('addOffer')
        
    } catch (error) {
        console.log(error);
        res.status(500).send('Internal Server Error');
    }
}

const addOfferDetails = async (req, res) => {
    try {
        const { name, activationDate, expireDate, discountAmount, offerType, applicableTo } = req.body;
        
        // Convert applicableTo IDs to ObjectId instances
        const convertToObjectId = (ids) => ids.map(id => new mongoose.Types.ObjectId(id));

        // Create a new Offer document
        const offer = new Offer({
            name,
            activeDate: new Date(activationDate),
            expireDate: new Date(expireDate),
            discount: discountAmount,
            type: offerType,
            applicableToProducts: offerType === 'product' ? convertToObjectId(applicableTo) : [],
            applicableToCategories: offerType === 'category' ? convertToObjectId(applicableTo) : []
        });

        // Save the Offer document
        await offer.save();

        res.status(200).json({ message: 'Offer added successfully' });
    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ message: 'An error occurred while adding the offer' });
    }
};


const getProducts = async (req,res) =>{
    try {
        const products = await Product.find();
        res.json(products);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
}

const getCategories = async (req,res) => {
    try {
        const categories = await Category.find();
        res.json(categories);
      } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
      }
}

const deleteOffer = async (req,res) => {
    try {
        await Offer.findByIdAndDelete(req.params.id);
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
}

const offerStatus = async (req,res) =>{
    const { active } = req.body;
    try {
        await Offer.findByIdAndUpdate(req.params.id, { active });
        res.json({ success: true });
    } catch (err) {
        console.error(err);
        res.json({ success: false });
    }
}

const loadOfferEdit = async (req, res) => {
    try {
        const offerId = req.params.id;
        const offer = await Offer.findById(offerId);

        if (!offer) {
            return res.status(404).send('Offer not found');
        }

        // Convert the offer data to a JSON string
        const offerData = JSON.stringify({
            offerType: offer.type,
            applicableIds: offer.type === 'product' ? offer.applicableToProducts : offer.applicableToCategories
        });

        // Render the edit page with the offer data
        res.render('editOffer', { offer, offerData });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Internal Server Error');
    }
}

const editOffer = async (req,res) =>{
    const { name, activationDate, expireDate, discountAmount, offerType, applicableTo } = req.body;

    try {
      const offer = await Offer.findByIdAndUpdate(
        req.params.id,
        {
          name,
          activeDate: activationDate,
          expireDate,
          discount: discountAmount,
          type: offerType,
          applicableToProducts: offerType === 'product' ? applicableTo : [],
          applicableToCategories: offerType === 'category' ? applicableTo : []
        },
        { new: true } // Return the updated document
      );
  
      res.json({ message: 'Offer updated successfully', offer });
    } catch (error) {
      console.error('Error updating offer:', error);
      res.status(500).json({ message: 'Error updating offer' });
    }
  };


module.exports = {
    loadOfferPage,
    addOffer,
    getProducts,
    getCategories,
    addOfferDetails,
    deleteOffer,
    offerStatus,
    loadOfferEdit,
    editOffer
}