
const express = require('express');
const router = express.Router();

const SoilAnalysis = require('../Models/SoilAnalysis');
const Farm = require('../Models/Farm');
const authMiddleware = require('../middleware/authMiddleware');

// All soil routes require a valid login token.
router.use(authMiddleware);

// Calculate crop and fertilizer recommendations.
const calculateRecommendations = (
    soilType,
    pHLevel,
    nitrogen,
    phosphorus,
    potassium
) => {
    let recommendations = [];
    let fertilizers = [];

    if (soilType) {
        const normalizedSoil = soilType.trim().toLowerCase();

        if (
            normalizedSoil.includes('alluvial') ||
            normalizedSoil.includes('jalodh')
        ) {
            recommendations = [
                'Wheat', 'Rice', 'Sugarcane', 'Maize', 'Pulses'
            ];
        } else if (
            normalizedSoil.includes('black') ||
            normalizedSoil.includes('regur')
        ) {
            recommendations = [
                'Cotton', 'Soybean', 'Wheat', 'Jowar', 'Linseed'
            ];
        } else if (
            normalizedSoil.includes('red') ||
            normalizedSoil.includes('yellow')
        ) {
            recommendations = [
                'Groundnut', 'Millets', 'Pulses', 'Tobacco', 'Potato'
            ];
        } else if (normalizedSoil.includes('laterite')) {
            recommendations = [
                'Tea', 'Coffee', 'Cashew', 'Rubber', 'Coconut'
            ];
        } else if (
            normalizedSoil.includes('sandy') ||
            normalizedSoil.includes('balui') ||
            normalizedSoil.includes('desert')
        ) {
            recommendations = [
                'Bajra', 'Barley', 'Mustard', 'Guar', 'Millets'
            ];
        } else if (
            normalizedSoil.includes('mountain') ||
            normalizedSoil.includes('forest') ||
            normalizedSoil.includes('parvatiya')
        ) {
            recommendations = [
                'Apples', 'Spices', 'Barley', 'Tea', 'Maize'
            ];
        } else {
            recommendations = ['Wheat', 'Rice', 'Pulses', 'Millets'];
        }
    }

    if (nitrogen !== undefined) {
        fertilizers.push(
            nitrogen < 35
                ? 'Urea (To cover Nitrogen deficiency)'
                : 'Nitrogen level is optimal'
        );
    }

    if (phosphorus !== undefined) {
        fertilizers.push(
            phosphorus < 25
                ? 'DAP / Single Super Phosphate (To cover Phosphorus deficiency)'
                : 'Phosphorus level is optimal'
        );
    }

    if (potassium !== undefined) {
        fertilizers.push(
            potassium < 30
                ? 'MOP / Potash (To cover Potassium deficiency)'
                : 'Potassium level is optimal'
        );
    }

    if (pHLevel !== undefined) {
        if (pHLevel < 6.0) {
            fertilizers.push('Agricultural Lime (To reduce soil acidity)');
        } else if (pHLevel > 7.5) {
            fertilizers.push(
                'Gypsum / Organic Manure (To balance soil alkalinity)'
            );
        }
    }

    return { recommendations, fertilizers };
};

// Helper: verify that a farm belongs to the logged-in user.
const getOwnedFarm = async (farmId, userId) => {
    return Farm.findOne({
        _id: farmId,
        farmer: userId
    });
};

// Helper: verify report ownership through its farm.
const getOwnedReport = async (reportId, userId) => {
    const report = await SoilAnalysis.findById(reportId);

    if (!report) {
        return { report: null, farm: null };
    }

    const farm = await getOwnedFarm(report.farm, userId);

    if (!farm) {
        return { report: null, farm: null };
    }

    return { report, farm };
};

// 1. CREATE soil report.
router.post('/add', async (req, res) => {
    try {
        const {
            farm,
            soilType,
            pHLevel,
            nitrogen,
            phosphorus,
            potassium,
            status
        } = req.body;

        if (!farm) {
            return res.status(400).json({
                message: 'Farm ID is required.'
            });
        }

        // A user cannot create a report for another user's farm.
        const ownedFarm = await getOwnedFarm(farm, req.user._id);

        if (!ownedFarm) {
            return res.status(403).json({
                message: 'You cannot create a report for this farm.'
            });
        }

        const allowedStatus = status || 'draft';

        if (!['draft', 'final'].includes(allowedStatus)) {
            return res.status(400).json({
                message: 'Status must be draft or final.'
            });
        }

        const { recommendations, fertilizers } =
            calculateRecommendations(
                soilType,
                Number(pHLevel),
                Number(nitrogen),
                Number(phosphorus),
                Number(potassium)
            );

        const newSoilData = new SoilAnalysis({
            farm: ownedFarm._id,
            soilType,
            pHLevel,
            nitrogen,
            phosphorus,
            potassium,
            recommendedCrops: recommendations,
            fertilizerRecommendations: fertilizers,
            status: allowedStatus
        });

        await newSoilData.save();

        const savedReport = await SoilAnalysis.findById(newSoilData._id)
            .populate('farm', 'farmName location');

        return res.status(201).json({
            success: true,
            message: 'Soil report created successfully.',
            data: savedReport
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// 2. READ reports belonging only to the logged-in user's farms.
router.get('/all', async (req, res) => {
    try {
        const farms = await Farm.find({
            farmer: req.user._id
        }).select('_id');

        const farmIds = farms.map(farm => farm._id);

        const reports = await SoilAnalysis.find({
            farm: { $in: farmIds }
        })
            .populate('farm', 'farmName location')
            .sort({ testedAt: -1 });

        return res.status(200).json({
            success: true,
            count: reports.length,
            reports
        });
    } catch (err) {
        return res.status(500).json({ error: err.message });
    }
});

// 3. READ history for an owned farm only.
router.get('/history/:farmId', async (req, res) => {
    try {
        const ownedFarm = await getOwnedFarm(
            req.params.farmId,
            req.user._id
        );

        if (!ownedFarm) {
            return res.status(404).json({
                message: 'Farm not found or access denied.'
            });
        }

        const history = await SoilAnalysis.find({
            farm: ownedFarm._id
        }).sort({ testedAt: -1 });

        return res.status(200).json({
            success: true,
            count: history.length,
            reports: history
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// 4. UPDATE an owned draft report only.
router.put('/update/:id', async (req, res) => {
    try {
        const { report } = await getOwnedReport(
            req.params.id,
            req.user._id
        );

        if (!report) {
            return res.status(404).json({
                message: 'Soil report not found or access denied.'
            });
        }

        if (report.status === 'final') {
            return res.status(403).json({
                message: 'Finalized reports cannot be updated.'
            });
        }

        // Only allow these fields to be changed.
        const fields = [
            'soilType',
            'pHLevel',
            'nitrogen',
            'phosphorus',
            'potassium'
        ];

        fields.forEach(field => {
            if (req.body[field] !== undefined) {
                report[field] = req.body[field];
            }
        });

        const { recommendations, fertilizers } =
            calculateRecommendations(
                report.soilType,
                report.pHLevel,
                report.nitrogen,
                report.phosphorus,
                report.potassium
            );

        report.recommendedCrops = recommendations;
        report.fertilizerRecommendations = fertilizers;

        await report.save();
        await report.populate('farm', 'farmName location');

        return res.status(200).json({
            success: true,
            message: 'Draft soil report updated successfully.',
            data: report
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// 5. FINALIZE an owned report.
router.put('/finalize/:id', async (req, res) => {
    try {
        const { report } = await getOwnedReport(
            req.params.id,
            req.user._id
        );

        if (!report) {
            return res.status(404).json({
                message: 'Soil report not found or access denied.'
            });
        }

        if (report.status === 'final') {
            return res.status(400).json({
                message: 'Report is already finalized.'
            });
        }

        report.status = 'final';
        await report.save();

        return res.status(200).json({
            success: true,
            message: 'Soil report finalized successfully.',
            data: report
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

// 6. DELETE an owned report only.
router.delete('/delete/:id', async (req, res) => {
    try {
        const { report } = await getOwnedReport(
            req.params.id,
            req.user._id
        );

        if (!report) {
            return res.status(404).json({
                message: 'Soil report not found or access denied.'
            });
        }

        await SoilAnalysis.findByIdAndDelete(report._id);

        return res.status(200).json({
            success: true,
            message: 'Soil report deleted successfully.'
        });
    } catch (err) {
        return res.status(400).json({ error: err.message });
    }
});

module.exports = router;
