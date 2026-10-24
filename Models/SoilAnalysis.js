const mongoose = require('mongoose');

const soilAnalysisSchema = new mongoose.Schema({
    // 1. Linked Farm Reference
    farm: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Farm',
        required: [true, 'Farm ID is required']
    },

    // 2. Soil Type
    soilType: {
        type: String,
        required: [true, 'Soil type is required'],
        trim: true
    },

    // 3. Soil Health Parameters (pH & NPK)
    pHLevel: {
        type: Number,
        required: [true, 'pH level is required'],
        min: [0, 'pH level cannot be below 0'],
        max: [14, 'pH level cannot exceed 14']
    },
    nitrogen: {
        type: Number,
        required: [true, 'Nitrogen (N) level is required'],
        min: [0, 'Nitrogen level cannot be negative']
    },
    phosphorus: {
        type: Number,
        required: [true, 'Phosphorus (P) level is required'],
        min: [0, 'Phosphorus level cannot be negative']
    },
    potassium: {
        type: Number,
        required: [true, 'Potassium (K) level is required'],
        min: [0, 'Potassium level cannot be negative']
    },

    // 4. Backend Auto-Generated Recommendations
    recommendedCrops: {
        type: [String],
        default: []
    },
    fertilizerRecommendations: {
        type: [String],
        default: []
    },

    // 5. Draft vs Finalize Workflow Status
    status: {
        type: String,
        enum: {
            values: ['draft', 'final'],
            message: 'Status must be either draft or final'
        },
        default: 'draft'
    },

    // 6. Record Timestamp
    testedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true // Automatically tracks createdAt and updatedAt
});

module.exports = mongoose.model('SoilAnalysis', soilAnalysisSchema);