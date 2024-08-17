const express = require('express');
const mongoose = require('mongoose');
const Order = require('../model/ordreModel');
const Product = require('../model/productModel');


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

async function getTopSellingCategories(limit = 5) {
  try {
      const topCategories = await Order.aggregate([
          { $unwind: '$products' },
          {
              $lookup: {
                  from: 'products',
                  localField: 'products.productId',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
          { $unwind: '$productDetails' },
          {
              $group: {
                  _id: '$productDetails.productCategory',
                  totalQuantitySold: { $sum: '$products.quantity' }
              }
          },
          { $sort: { totalQuantitySold: -1 } },
          { $limit: limit },
          {
              $lookup: {
                  from: 'categories',
                  localField: '_id',
                  foreignField: '_id',
                  as: 'categoryDetails'
              }
          },
          { $unwind: '$categoryDetails' },
          {
              $project: {
                  _id: 1,
                  categoryName: '$categoryDetails.name',
                  quantitySold: '$totalQuantitySold'
              }
          }
      ]);

      return topCategories;
  } catch (error) {
      console.error('Error getting top selling categories:', error);
      throw error;
  }
}

async function getTopSellingBrands(limit = 5) {
  try {
      const topBrands = await Order.aggregate([
          { $unwind: '$products' },
          {
              $lookup: {
                  from: 'products',
                  localField: 'products.productId',
                  foreignField: '_id',
                  as: 'productDetails'
              }
          },
          { $unwind: '$productDetails' },
          {
              $group: {
                  _id: '$productDetails.brand',
                  totalQuantitySold: { $sum: '$products.quantity' }
              }
          },
          { $sort: { totalQuantitySold: -1 } },
          { $limit: limit },
          {
              $project: {
                  _id: 1,
                  brandName: '$_id',
                  quantitySold: '$totalQuantitySold'
              }
          }
      ]);

      return topBrands;
  } catch (error) {
      console.error('Error getting top selling brands:', error);
      throw error;
  }
}

const topSellingProducts = async (req, res) => {
  try {
      const topProducts = await getTopSellingProducts();
      res.json(topProducts);
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
};

const topSellingCategories = async (req, res) => {
  try {
      const topCategories = await getTopSellingCategories();
      res.json(topCategories);
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
};

const topSellingBrands = async (req, res) => {
  try {
      const topBrands = await getTopSellingBrands();
      res.json(topBrands);
  } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
  }
};

module.exports = {
  topSellingProducts,
  topSellingCategories,
  topSellingBrands
};
