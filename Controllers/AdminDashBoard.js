const express = require('express');
const mongoose = require('mongoose');
const Order = require('../model/ordreModel');
const Product = require('../model/productModel');


// Define the getTopSellingProducts function
async function getTopSellingProducts(limit = 5) {
    try {
      const topProducts = await Order.aggregate([
        { $unwind: '$products' },
        {
          $group: {
            _id: '$products.productId',
            totalQuantitySold: { $sum: '$products.quantity' }
          }
        },
        { $sort: { totalQuantitySold: -1 } },
        { $limit: limit },
        {
          $lookup: {
            from: 'products',
            localField: '_id',
            foreignField: '_id',
            as: 'productDetails'
          }
        },
        { $unwind: '$productDetails' },
        {
            $project: {
              _id: 1,
              productName: '$productDetails.productname',
              category: '$productDetails.productCategory',
              quantitySold: '$totalQuantitySold',
              price: '$productDetails.price',
              image: { $arrayElemAt: [{ $arrayElemAt: ['$productDetails.variants.images', 0] }, 0] }
            }
          }
        ]);
  
      return topProducts;
    } catch (error) {
      console.error('Error getting top selling products:', error);
      throw error;
    }
  }


const topSellingProducts = async (req,res) => {
    try {
        const topProducts = await getTopSellingProducts();
        res.json(topProducts);
      } catch (error) {
        res.status(500).json({ error: 'Internal server error' });
      }
    };
    

module.exports = {
    topSellingProducts
}