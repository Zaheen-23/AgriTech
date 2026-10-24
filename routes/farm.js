
const express = require('express');
const router = express.Router();

const Farm = require('../Models/Farm');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: only admin or the farm's owner can manage a farm
const canManageFarm = (farm, user) => {
    return (
        user.role === 'admin' ||
        (
            user.role === 'farmer' &&
            farm.farmer.toString() === user._id.toString()
        )
    );
};

// 1. CREATE FARM
router.post('/add', authMiddleware, async (req, res) => {
    try {
        const { farmName, location, size, soilType } = req.body;

        if (!farmName || !location || !size || !soilType) {
            return res.status(400).json({
                message: 'Farm name, location, size and soil type are required.'
            });
        }

        // Only admins and farmers can create farms.
        // A farmer cannot assign a farm to another user.
        if (!['admin', 'farmer'].includes(req.user.role)) {
            return res.status(403).json({
                message: 'You are not allowed to create farms.'
            });
        }

        const farmerId =
            req.user.role === 'admin' && req.body.farmer
                ? req.body.farmer
                : req.user._id;

        const newFarm = new Farm({
            farmer: farmerId,
            farmName: farmName.trim(),
            location: location.trim(),
            size: String(size).trim(),
            soilType: soilType.trim()
        });

        await newFarm.save();

        return res.status(201).json({
            message: 'Farm added successfully!',
            farm: newFarm
        });
    } catch (err) {
        console.error('Create Farm Error:', err.message);
        return res.status(500).json({
            message: 'Unable to create farm.'
        });
    }
});

// 2. GET FARMS
router.get('/all', authMiddleware, async (req, res) => {
    try {
        let farms;

        if (req.user.role === 'admin') {
            farms = await Farm.find().sort({ createdAt: -1 });
        } else if (req.user.role === 'farmer') {
            farms = await Farm.find({
                farmer: req.user._id
            }).sort({ createdAt: -1 });
        } else {
            return res.status(403).json({
                message: 'You are not allowed to access farm records.'
            });
        }

        return res.status(200).json(farms);
    } catch (err) {
        console.error('Get Farms Error:', err.message);
        return res.status(500).json({
            message: 'Unable to fetch farms.'
        });
    }
});

// 3. UPDATE FARM
router.put('/update/:id', authMiddleware, async (req, res) => {
    try {
        const farm = await Farm.findById(req.params.id);

        if (!farm) {
            return res.status(404).json({
                message: 'Farm not found.'
            });
        }

        if (!canManageFarm(farm, req.user)) {
            return res.status(403).json({
                message: 'You cannot update another farmer’s farm.'
            });
        }

        // Do not allow changing ownership through this endpoint.
        const { farmName, location, size, soilType } = req.body;
        const updates = {};

        if (farmName !== undefined) updates.farmName = farmName;
        if (location !== undefined) updates.location = location;
        if (size !== undefined) updates.size = size;
        if (soilType !== undefined) updates.soilType = soilType;

        const updatedFarm = await Farm.findByIdAndUpdate(
            req.params.id,
            { $set: updates },
            { new: true, runValidators: true }
        );

        return res.status(200).json({
            message: 'Farm updated successfully!',
            farm: updatedFarm
        });
    } catch (err) {
        console.error('Update Farm Error:', err.message);
        return res.status(500).json({
            message: 'Unable to update farm.'
        });
    }
});

// 4. DELETE FARM
router.delete('/delete/:id', authMiddleware, async (req, res) => {
    try {
        const farm = await Farm.findById(req.params.id);

        if (!farm) {
            return res.status(404).json({
                message: 'Farm not found.'
            });
        }

        if (!canManageFarm(farm, req.user)) {
            return res.status(403).json({
                message: 'You cannot delete another farmer’s farm.'
            });
        }

        await Farm.findByIdAndDelete(req.params.id);

        return res.status(200).json({
            message: 'Farm deleted successfully!'
        });
    } catch (err) {
        console.error('Delete Farm Error:', err.message);
        return res.status(500).json({
            message: 'Unable to delete farm.'
        });
    }
});

module.exports = router;
