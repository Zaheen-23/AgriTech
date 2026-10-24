const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema({
    farm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: true
    },
    temperature: {
        type: Number,
        required: true
    },
    humidity: {
        type: Number,
        required: true
    },
    condition: {
        type: String, // Jaise "Sunny", "Rainy", "Cloudy"
        required: true
    },
    recordedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('Weather', weatherSchema);