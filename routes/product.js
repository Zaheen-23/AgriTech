
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Product = require('../Models/Product');

// 1. Get all products (with optional category filter)
router.get('/', async (req, res) => {
    try {
        const { category } = req.query;
        const query = {};

        if (category && category.toLowerCase() !== 'all') {
            query.category = {
                $regex: `^${category.trim()}$`,
                $options: 'i',
            };
        }

        // Hide inactive products if isActive exists in your model
        if (Product.schema.path('isActive')) {
            query.isActive = true;
        }

        const products = await Product.find(query).sort({ createdAt: -1 });

        res.status(200).json(products);
    } catch (err) {
        console.error('Error fetching products:', err.message);
        res.status(500).json({ message: 'Failed to fetch products' });
    }
});

// 2. Get single product by ID
router.get('/:id', async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid product ID' });
        }

        const query = { _id: req.params.id };

        if (Product.schema.path('isActive')) {
            query.isActive = true;
        }

        const product = await Product.findOne(query);

        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }

        res.status(200).json(product);
    } catch (err) {
        console.error('Error fetching product:', err.message);
        res.status(500).json({ message: 'Failed to fetch product' });
    }
});

module.exports = router;
