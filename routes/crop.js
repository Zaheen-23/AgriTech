const express = require('express');
const router = express.Router();
const Crop = require('../Models/Crop');

// 1. Add a new Crop
router.post('/add', async (req, res) => {
    try {
        const { farmer, name, category, price, quantity, location } = req.body;

        const newCrop = new Crop({
            farmer,
            name,
            category,
            price,
            quantity,
            location
        });

        await newCrop.save();
        res.status(201).json({ message: 'Crop added successfully!', crop: newCrop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get All Crops
router.get('/all', async (req, res) => {
    try {
        const crops = await Crop.find().populate('farmer', 'name email phone');
        res.status(200).json(crops);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Update Crop (Edit / Information Change)
router.put('/update/:id', async (req, res) => {
    try {
        const updatedCrop = await Crop.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true } // Returns the updated document
        );

        if (!updatedCrop) {
            return res.status(404).json({ message: 'Crop not found!' });
        }

        res.status(200).json({ message: 'Crop updated successfully!', crop: updatedCrop });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Delete Crop
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedCrop = await Crop.findByIdAndDelete(req.params.id);

        if (!deletedCrop) {
            return res.status(404).json({ message: 'Crop not found!' });
        }

        res.status(200).json({ message: 'Crop deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});
module.exports = router;
