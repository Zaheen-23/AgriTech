
const express = require('express');
const router = express.Router();
const ExpertConsultation = require('../Models/ExpertConsultation');
const authMiddleware = require('../middleware/authMiddleware');

// Helper: sirf Expert aur Admin allowed
const expertOnly = (req, res, next) => {
    if (!['agriculturalist', 'admin'].includes(req.user?.role)) {
        return res.status(403).json({
            message: 'Only experts and admins can access this route.'
        });
    }
    next();
};

// ==========================================
// 1. CREATE: Farmer consultation
// ==========================================

router.post('/create', async (req, res) => {
    try {
        const { farmer, subject, question, isFinal } = req.body;

        const newConsultation = new ExpertConsultation({
            farmer,
            subject,
            question,
            status: isFinal ? 'Pending' : 'Draft'
        });

        await newConsultation.save();

        res.status(201).json({
            message: isFinal
                ? 'Consultation query submitted successfully!'
                : 'Consultation query saved as Draft!',
            consultation: newConsultation
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 2. READ: Questions for Experts
// ==========================================

router.get('/all', authMiddleware, expertOnly, async (req, res) => {
    try {
        const queries = await ExpertConsultation.find({
            $or: [
                { status: 'Pending' },
                { status: 'Answered', expert: req.user._id }
            ]
        })
            .populate('farmer', 'name')
            .populate('expert', 'name email')
            .sort({ createdAt: -1 });

        res.status(200).json(queries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 3. READ: Farmer's Queries
// Put this BEFORE /:id
// ==========================================

router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const farmerQueries = await ExpertConsultation.find({
            farmer: req.params.farmerId
        }).sort({ createdAt: -1 });

        res.status(200).json(farmerQueries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 4. READ: Single Query
// ==========================================

router.get('/:id', async (req, res) => {
    try {
        const query = await ExpertConsultation.findById(req.params.id)
            .populate('farmer', 'name email phone')
            .populate('expert', 'name email');

        if (!query) {
            return res.status(404).json({
                message: 'Consultation query not found!'
            });
        }

        res.status(200).json(query);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 5. UPDATE: Farmer edits a query
// ==========================================

router.put('/update/:id', async (req, res) => {
    try {
        const { subject, question, isFinal } = req.body;
        const query = await ExpertConsultation.findById(req.params.id);

        if (!query) {
            return res.status(404).json({
                message: 'Consultation query not found!'
            });
        }

        if (subject) query.subject = subject;
        if (question) query.question = question;

        if (isFinal && query.status === 'Draft') {
            query.status = 'Pending';
        }

        query.updatedAt = Date.now();
        await query.save();

        res.status(200).json({
            message: 'Consultation query updated successfully!',
            consultation: query
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// ==========================================
// 6. ANSWER: Expert responds to a question
// ==========================================

router.put(
    '/answer/:id',
    authMiddleware,
    expertOnly,
    async (req, res) => {
        try {
            const { answer } = req.body;

            if (typeof answer !== 'string' || !answer.trim()) {
                return res.status(400).json({
                    message: 'Please provide an answer.'
                });
            }

            const query = await ExpertConsultation.findById(req.params.id);

            if (!query) {
                return res.status(404).json({
                    message: 'Consultation query not found!'
                });
            }

            // Doosre expert ka answered question overwrite nahi hoga
            if (
                query.status === 'Answered' &&
                String(query.expert) !== String(req.user._id) &&
                req.user.role !== 'admin'
            ) {
                return res.status(403).json({
                    message: 'This question has already been answered by another expert.'
                });
            }

            if (query.status !== 'Pending' && query.status !== 'Answered') {
                return res.status(400).json({
                    message: 'Only submitted questions can be answered.'
                });
            }

            query.answer = answer.trim();

            // Expert ID client se nahi, verified login se aayegi
            query.expert = req.user._id;
            query.status = 'Answered';
            query.updatedAt = Date.now();

            await query.save();

            res.status(200).json({
                message: 'Expert response saved successfully!',
                consultation: query
            });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
    }
);

// ==========================================
// 7. DELETE: Existing delete operation
// ==========================================

router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedQuery =
            await ExpertConsultation.findByIdAndDelete(req.params.id);

        if (!deletedQuery) {
            return res.status(404).json({
                message: 'Consultation query not found!'
            });
        }

        res.status(200).json({
            message: 'Consultation query deleted successfully!'
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
