
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Order = require('../Models/Order');
const Product = require('../Models/Product');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// 1. Create order for the logged-in user
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { items } = req.body;
        const userId = req.user._id;

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'No items in the order'
            });
        }

        const quantities = new Map();

        for (const item of items) {
            if (!mongoose.isValidObjectId(item.product)) {
                return res.status(400).json({
                    message: 'Invalid product ID'
                });
            }

            if (!Number.isInteger(item.quantity) || item.quantity < 1) {
                return res.status(400).json({
                    message: 'Quantity must be a positive integer'
                });
            }

            const id = String(item.product);
            quantities.set(id, (quantities.get(id) || 0) + item.quantity);
        }

        const processedItems = [];
        let totalAmount = 0;

        for (const [productId, quantity] of quantities) {
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({
                    message: 'Product not found'
                });
            }

            if (product.stock < quantity) {
                return res.status(400).json({
                    message: `Insufficient stock for ${product.name}`
                });
            }

            processedItems.push({
                product: product._id,
                quantity,
                price: product.price
            });

            totalAmount += product.price * quantity;
        }

        const decremented = [];

        try {
            for (const item of processedItems) {
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.product,
                        stock: { $gte: item.quantity }
                    },
                    { $inc: { stock: -item.quantity } },
                    { new: true }
                );

                if (!updatedProduct) {
                    throw new Error(
                        'Stock changed during checkout. Please try again.'
                    );
                }

                decremented.push(item);
            }

            const newOrder = new Order({
                user: userId,
                items: processedItems,
                totalAmount,
                status: 'Pending'
            });

            await newOrder.save();

            return res.status(201).json({
                message: 'Order placed successfully!',
                order: newOrder
            });
        } catch (error) {
            for (const item of decremented.reverse()) {
                await Product.updateOne(
                    { _id: item.product },
                    { $inc: { stock: item.quantity } }
                );
            }

            throw error;
        }
    } catch (err) {
        console.error('Order Creation Error:', err.message);

        return res.status(500).json({
            message: err.message || 'Failed to place order'
        });
    }
});

// 2. Farmer sees only own orders; admin sees all
router.get('/', authMiddleware, async (req, res) => {
    try {
        const query = req.user.role === 'admin'
            ? {}
            : { user: req.user._id };

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate(
                'items.product',
                'name price category image description'
            )
            .sort({ createdAt: -1 });

        return res.status(200).json(orders);
    } catch (err) {
        console.error('Fetch Orders Error:', err.message);

        return res.status(500).json({
            message: 'Failed to fetch orders'
        });
    }
});

// 3. Only admin can update order status
router.put(
    '/:id/status',
    authMiddleware,
    adminMiddleware,
    async (req, res) => {
        try {
            if (!mongoose.isValidObjectId(req.params.id)) {
                return res.status(400).json({
                    message: 'Invalid order ID'
                });
            }

            const { status } = req.body;

            const validStatuses = [
                'Pending',
                'Processing',
                'Shipped',
                'Delivered'
            ];

            if (!validStatuses.includes(status)) {
                return res.status(400).json({
                    message: 'Invalid status value'
                });
            }

            const updatedOrder = await Order.findByIdAndUpdate(
                req.params.id,
                { $set: { status } },
                { new: true, runValidators: true }
            )
                .populate('user', 'name email')
                .populate('items.product', 'name price category');

            if (!updatedOrder) {
                return res.status(404).json({
                    message: 'Order not found'
                });
            }

            return res.status(200).json({
                message: 'Order status updated successfully!',
                order: updatedOrder
            });
        } catch (err) {
            console.error('Update Status Error:', err.message);

            return res.status(500).json({
                message: 'Failed to update order status'
            });
        }
    }
);

module.exports = router;
