const mongoose = require('mongoose');

const pestAlertSchema = new mongoose.Schema({
    pestName: {
        type: String,
        required: true,
        trim: true
    },
    affectedCrop: {
        type: String, // e.g., "Wheat", "Rice", "Cotton"
        required: true
    },
    season: {
        type: String,
        enum: ['Kharif', 'Rabi', 'Zaid', 'All-Season'],
        required: true
    },
    symptoms: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ['Low', 'Medium', 'High', 'Critical'],
        default: 'Medium'
    },
    treatment: {
        type: String,
        required: true
    },
    alertType: {
        type: String,
        enum: ['permanent', 'emergency'],
        default: 'permanent'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('PestAlert', pestAlertSchema);