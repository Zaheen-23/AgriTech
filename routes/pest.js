const express = require('express');
const router = express.Router();
const PestAlert = require('../Models/PestAlert');

// 1. Get Permanent Pest Advisory for a Selected Crop (Used by Dropdown in Frontend)
router.get('/crop/:cropName', async (req, res) => {
    try {
        const crop = req.params.cropName;
        // Search pest data matching crop name (case-insensitive)
        const alerts = await PestAlert.find({ 
            affectedCrop: { $regex: new RegExp(crop, 'i') },
            alertType: 'permanent'
        });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Pests Filtered by Season (Used for Season-Based Scroll / Filtering)
router.get('/season/:seasonName', async (req, res) => {
    try {
        const season = req.params.seasonName;
        // Search pests matching the selected season (Rabi, Kharif, Zaid, etc.)
        const alerts = await PestAlert.find({ 
            season: { $regex: new RegExp(season, 'i') }
        });

        res.status(200).json({
            success: true,
            count: alerts.length,
            alerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 3. Get All Emergency Admin Pest Alerts (For Emergency Banner/Notification)
router.get('/emergency', async (req, res) => {
    try {
        const emergencyAlerts = await PestAlert.find({ alertType: 'emergency' }).sort({ createdAt: -1 });
        res.status(200).json({
            success: true,
            count: emergencyAlerts.length,
            alerts: emergencyAlerts
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 4. Add New Pest Advisory or Emergency Alert (Admin API)
router.post('/add', async (req, res) => {
    try {
        const newAlert = new PestAlert(req.body);
        await newAlert.save();
        res.status(201).json({
            success: true,
            message: 'Pest alert created successfully!',
            alert: newAlert
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;