const express = require('express');
const router = express.Router();
const CommunityPost = require('../Models/CommunityPost');

// ==========================================
// 1. CREATE Operations
// ==========================================

// Create a new community post (Draft or Published)
router.post('/create', async (req, res) => {
    try {
        const { author, title, content, tags, isFinal } = req.body;
        
        // Agar isFinal true hai toh status 'Published' ho jayega, warna 'Draft'
        const postStatus = isFinal ? 'Published' : 'Draft';

        const newPost = new CommunityPost({
            author,
            title,
            content,
            tags,
            status: postStatus
        });

        await newPost.save();
        res.status(201).json({
            message: isFinal ? 'Community post published successfully!' : 'Community post saved as Draft!',
            post: newPost
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 2. READ Operations
// ==========================================

// Get All Community Posts (Public Feed - Only Published posts or all based on requirement)
router.get('/all', async (req, res) => {
    try {
        const posts = await CommunityPost.find()
            .populate('author', 'name role')
            .populate('comments.user', 'name role')
            .sort({ createdAt: -1 });
        res.status(200).json(posts);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Get Single Community Post by ID
router.get('/:id', async (req, res) => {
    try {
        const post = await CommunityPost.findById(req.params.id)
            .populate('author', 'name role')
            .populate('comments.user', 'name role');

        if (!post) {
            return res.status(404).json({ message: 'Community post not found!' });
        }

        res.status(200).json(post);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 3. UPDATE Operations
// ==========================================

// Update Community Post (Edit Draft or Published Post, or Publish a Draft)
router.put('/update/:id', async (req, res) => {
    try {
        const { title, content, tags, isFinal } = req.body;
        const post = await CommunityPost.findById(req.params.id);

        if (!post) {
            return res.status(404).json({ message: 'Community post not found!' });
        }

        if (title) post.title = title;
        if (content) post.content = content;
        if (tags) post.tags = tags;

        // Draft se Published karne ka logic
        if (isFinal && post.status === 'Draft') {
            post.status = 'Published';
        }

        post.updatedAt = Date.now();
        await post.save();

        res.status(200).json({
            message: 'Community post updated successfully!',
            post
        });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// Add a Comment to a Post (Peer-to-Peer interaction)
router.post('/comment/:id', async (req, res) => {
    try {
        const { user, text } = req.body;
        const post = await CommunityPost.findById(req.params.id);
        
        if (!post) {
            return res.status(404).json({ message: 'Community post not found!' });
        }

        post.comments.push({ user, text });
        await post.save();

        res.status(200).json({ message: 'Comment added successfully!', post });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});


// ==========================================
// 4. DELETE Operations
// ==========================================

// Delete Post by ID
router.delete('/delete/:id', async (req, res) => {
    try {
        const deletedPost = await CommunityPost.findByIdAndDelete(req.params.id);

        if (!deletedPost) {
            return res.status(404).json({ message: 'Community post not found!' });
        }

        res.status(200).json({ message: 'Community post deleted successfully!' });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;