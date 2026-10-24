const express = require('express');
const router = express.Router();
const MasterCrop = require('../Models/masterCrop');

// 1. Get All Master Crops (Dropdown aur Advisory list ke liye)
router.get('/all', async (req, res) => {
    try {
        const crops = await MasterCrop.find();
        res.status(200).json({
            success: true,
            count: crops.length,
            crops
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Single Crop Details by Name (Jab user dropdown se koi specific crop select kare)
router.get('/:cropName', async (req, res) => {
    try {
        const crop = await MasterCrop.findOne({ 
            cropName: { $regex: new RegExp(req.params.cropName, 'i') } 
        });

        if (!crop) {
            return res.status(404).json({ message: 'Master crop details not found!' });
        }

        res.status(200).json({
            success: true,
            crop
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;