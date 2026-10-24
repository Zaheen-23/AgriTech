const mongoose = require('mongoose');

const cropSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    name: {
        type: String,
        required: true
    },
    category: {
        type: String, // e.g., Vegetables, Fruits, Grains
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    quantity: {
        type: String, // e.g., "100 kg"
        required: true
    },
    location: {
        type: String,
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
});



module.exports = mongoose.model('Crop', cropSchema);