
const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();

const Order = require('../Models/Order');
const Product = require('../Models/Product');

// IMPORTANT:
// Add your existing authentication middleware to these routes.
// Admin status updates must be restricted to admins.

// 1. Create a new order
router.post('/', async (req, res) => {
    try {
        const { userId, items } = req.body;

        if (!mongoose.isValidObjectId(userId)) {
            return res.status(400).json({
                message: 'Valid userId is required'
            });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return res.status(400).json({
                message: 'No items in the order'
            });
        }

        // Validate all items before changing stock
        for (const item of items) {
            if (!mongoose.isValidObjectId(item.product)) {
                return res.status(400).json({
                    message: 'Invalid product ID'
                });
            }

            if (
                !Number.isInteger(item.quantity) ||
                item.quantity < 1
            ) {
                return res.status(400).json({
                    message: 'Quantity must be a positive integer'
                });
            }
        }

        // Combine duplicate product IDs
        const quantities = new Map();

        for (const item of items) {
            const id = String(item.product);
            quantities.set(
                id,
                (quantities.get(id) || 0) + item.quantity
            );
        }

        const processedItems = [];
        let totalAmount = 0;

        // Read and validate products before stock updates
        for (const [productId, quantity] of quantities) {
            const product = await Product.findById(productId);

            if (!product) {
                return res.status(404).json({
                    message: `Product not found: ${productId}`
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

        // Decrement stock only when enough stock remains.
        // If any update fails, restore earlier decrements.
        const decremented = [];

        try {
            for (const item of processedItems) {
                const updatedProduct = await Product.findOneAndUpdate(
                    {
                        _id: item.product,
                        stock: { $gte: item.quantity }
                    },
                    {
                        $inc: { stock: -item.quantity }
                    },
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
            // Restore stock if order creation/update fails
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

        res.status(500).json({
            message: err.message || 'Failed to place order'
        });
    }
});

// 2. Get orders
router.get('/', async (req, res) => {
    try {
        // Replace query-based identity with authenticated user
        // after attaching your auth middleware.
        const { userId, role } = req.query;

        let query = {};

        if (role && role.toLowerCase() === 'farmer') {
            if (!mongoose.isValidObjectId(userId)) {
                return res.status(400).json({
                    message: 'Valid userId is required'
                });
            }

            query.user = userId;
        }

        const orders = await Order.find(query)
            .populate('user', 'name email')
            .populate(
                'items.product',
                'name price category image description'
            )
            .sort({ createdAt: -1 });

        res.status(200).json(orders);
    } catch (err) {
        console.error('Fetch Orders Error:', err.message);

        res.status(500).json({
            message: 'Failed to fetch orders'
        });
    }
});

// 3. Update order status (Admin only)
router.put('/:id/status', async (req, res) => {
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

        // IMPORTANT: Protect this route with admin auth middleware.
        const updatedOrder = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true, runValidators: true }
        )
            .populate('user', 'name email')
            .populate('items.product', 'name price category');

        if (!updatedOrder) {
            return res.status(404).json({
                message: 'Order not found'
            });
        }

        res.status(200).json({
            message: 'Order status updated successfully!',
            order: updatedOrder
        });
    } catch (err) {
        console.error('Update Status Error:', err.message);

        res.status(500).json({
            message: 'Failed to update order status'
        });
    }
});

module.exports = router;
