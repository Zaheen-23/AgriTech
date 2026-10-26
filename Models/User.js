
const mongoose = require('mongoose');

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
    },

    // Email verification
    isEmailVerified: {
        type: Boolean,
        default: false
    },
    emailVerificationToken: {
        type: String,
        default: undefined
    },
    emailVerificationExpires: {
        type: Date,
        default: undefined
    }

}, {
    timestamps: true
});

module.exports = mongoose.model('User', userSchema);
