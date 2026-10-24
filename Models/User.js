const mongoose = require('mongoose');

// 1. User Schema defining
const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        trim: true
    },
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
        lowercase: true
    },
    password: {
        type: String,
        required: true
    },
    role: {
        type: String,
        enum: ['farmer', 'buyer', 'agriculturalist', 'admin'],
        default: 'farmer' 
    },
    phone: {
        type: String,
        required: true
    }
}, {
    timestamps: true //  created_at and updated_at 
});

// 2. Model - Export 
module.exports = mongoose.model('User', userSchema);