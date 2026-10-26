const express = require('express');
const router = express.Router();
const ExpertConsultation = require('../Models/ExpertConsultation');
const authMiddleware = require('../middleware/authMiddleware');

// ==========================================
// 1. CREATE Operations
// ==========================================

// Create a new consultation query (Draft or Finalize)
router.post('/create', async (req, res) => {
    try {
        const { farmer, subject, question, isFinal } = req.body;
        
        // Agar user finalize karta hai toh status 'Pending' banega, warna 'Draft'
        const initialStatus = isFinal ? 'Pending' : 'Draft';

        const newConsultation = new ExpertConsultation({
            farmer,
            subject,
            question,
            status: initialStatus
        });

        await newConsultation.save();
        res.status(201).json({
            message: isFinal ? 'Consultation query submitted successfully!' : 'Consultation query saved as Draft!',
            consultation: newConsultation
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 2. READ Operations
// ==========================================

// Get All Consultation Queries (For Experts/Admins or listing)
router.get('/all', async (req, res) => {
    try {
        const queries = await ExpertConsultation.find()
            .populate('farmer', 'name email phone')
            .populate('expert', 'name email')
            .sort({ createdAt: -1 });
        res.status(200).json(queries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Consultation Query by ID
router.get('/:id', async (req, res) => {
    try {
        const query = await ExpertConsultation.findById(req.params.id)
            .populate('farmer', 'name email phone')
            .populate('expert', 'name email');

        if (!query) {
            return res.status(404).json({ message: 'Consultation query not found!' });
        }

        res.status(200).json(query);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Queries specific to a Farmer
router.get('/farmer/:farmerId', async (req, res) => {
    try {
        const farmerQueries = await ExpertConsultation.find({ farmer: req.params.farmerId })
            .sort({ createdAt: -1 });
        res.status(200).json(farmerQueries);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 3. UPDATE Operations
// ==========================================

// Update Query (Farmer editing Draft/Pending Query or Finalizing Draft)
router.put('/update/:id', async (req, res) => {
    try {
        const { subject, question, isFinal } = req.body;
        const query = await ExpertConsultation.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Consultation query not found!' });
        }

        // Field updates
        if (subject) query.subject = subject;
        if (question) query.question = question;

        // Draft to Finalize logic
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

// Answer Query (Expert / Admin responding to query)
router.put('/answer/:id', async (req, res) => {
    try {
        const { answer, expert } = req.body;

        const query = await ExpertConsultation.findById(req.params.id);

        if (!query) {
            return res.status(404).json({ message: 'Consultation query not found!' });
        }

        query.answer = answer;
        query.expert = expert;
        query.status = 'Answered';
        query.updatedAt = Date.now();

        await query.save();

        res.status(200).json({
            message: 'Expert response updated successfully!',
            consultation: query
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 4. DELETE Operation
// ==========================================

// Delete Query by ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedQuery = await ExpertConsultation.findByIdAndDelete(req.params.id);

        if (!deletedQuery) {
            return res.status(404).json({ message: 'Consultation query not found!' });
        }

        res.status(200).json({ message: 'Consultation query deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
