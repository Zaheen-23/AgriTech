
const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Crop = require('../Models/Crop');
const authMiddleware = require('../middleware/authMiddleware');
const adminMiddleware = require('../middleware/adminMiddleware');

// 1. Add crop: farmer ID token se aayegi
router.post('/add', authMiddleware, async (req, res) => {
    try {
        if (req.user.role !== 'farmer') {
            return res.status(403).json({
                message: 'Only farmers can add crops.'
            });
        }

        const { name, category, price, quantity, location } = req.body;

        const newCrop = new Crop({
            farmer: req.user._id,
            name,
            category,
            price,
            quantity,
            location
        });

        await newCrop.save();

        res.status(201).json({
            message: 'Crop added successfully!',
            crop: newCrop
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Farmers see their own crops; admin can see all
router.get('/all', authMiddleware, async (req, res) => {
    try {
        const filter = req.user.role === 'admin'
            ? {}
            : { farmer: req.user._id };

        const crops = await Crop.find(filter)
            .populate('farmer', 'name email phone');

        res.status(200).json(crops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update only your own crop; admin can update any
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid crop ID.' });
        }

        const filter = req.user.role === 'admin'
            ? { _id: req.params.id }
            : { _id: req.params.id, farmer: req.user._id };

        const allowedFields = [
            'name', 'category', 'price', 'quantity', 'location'
        ];

        const updates = {};
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                updates[field] = req.body[field];
            }
        }

        const updatedCrop = await Crop.findOneAndUpdate(
            filter,
            { $set: updates },
            { new: true, runValidators: true }
        );

        if (!updatedCrop) {
            return res.status(404).json({
                message: 'Crop not found or access denied.'
            });
        }

        res.status(200).json({
            message: 'Crop updated successfully!',
            crop: updatedCrop
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete only your own crop; admin can delete any
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        if (!mongoose.isValidObjectId(req.params.id)) {
            return res.status(400).json({ message: 'Invalid crop ID.' });
        }

        const filter = req.user.role === 'admin'
            ? { _id: req.params.id }
            : { _id: req.params.id, farmer: req.user._id };

        const deletedCrop = await Crop.findOneAndDelete(filter);

        if (!deletedCrop) {
            return res.status(404).json({
                message: 'Crop not found or access denied.'
            });
        }

        res.status(200).json({
            message: 'Crop deleted successfully!'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
