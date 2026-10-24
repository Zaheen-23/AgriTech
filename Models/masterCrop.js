const mongoose = require('mongoose');

const masterCropSchema = new mongoose.Schema({
    cropName: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    category: {
        type: String,
        required: true
    },
    season: {
        type: String,
        required: true
    },
    durationInDays: {
        type: Number,
        required: true
    },
    idealSoilType: [{
        type: String
    }],
    expectedYieldPerAcre: {
        type: String,
        required: true
    },
    waterRequirement: {
        type: String,
        required: true
    },
    idealTemperature: {
        type: String,
        required: true
    },
    commonPests: [{
        type: String
    }],
    recommendedFertilizer: {
        type: String,
        required: true
    },
    soilPhRange: {
        type: String,
        required: true
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('MasterCrop', masterCropSchema);