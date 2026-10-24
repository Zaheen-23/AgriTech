const express = require('express');
const router = express.Router();
const Weather = require('../Models/Weather');

// 1. Save Weather Data
router.post('/add', async (req, res) => {
    try {
        const { farm, temperature, humidity, condition } = req.body;
        const newWeather = new Weather({ farm, temperature, humidity, condition });
        await newWeather.save();
        res.status(201).json({ message: 'Weather data saved successfully!', weather: newWeather });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// 2. Get Weather Data for all Farms
router.get('/all', async (req, res) => {
    try {
        const weatherLogs = await Weather.find().populate('farm', 'farmName location');
        res.status(200).json(weatherLogs);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;