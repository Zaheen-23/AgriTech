const mongoose = require('mongoose');

const expertConsultationSchema = new mongoose.Schema({
    farmer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    subject: {
        type: String,
        required: true,
        trim: true
    },
    question: {
        type: String,
        required: true
    },
    answer: {
        type: String,
        default: 'Pending expert response'
    },
    expert: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    status: {
        type: String,
        enum: ['Draft', 'Pending', 'Answered'],
        default: 'Draft'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ExpertConsultation', expertConsultationSchema);