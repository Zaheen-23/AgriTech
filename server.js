const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// 2. Express App initialize kar rahe hain
const app = express();

app.use(cors());
app.use(express.json()); 

app.get('/', (req, res) => {
    res.send('AgriTech Backend Server running successfully!');
});


const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log("MongoDB Atlas Connected Successfully!");
  })
  .catch((err) => {
    console.error("MongoDB Connection Error:", err.message);
  });
    
const authRoutes = require('./routes/auth.js');
app.use('/api/auth', authRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});

const cropRoutes = require('./routes/crop');
app.use('/api/crops', cropRoutes);

const farmRoutes = require('./routes/farm');
app.use('/api/farms', farmRoutes);

const orderRoutes = require('./routes/order');
app.use('/api/orders', orderRoutes);

const weatherRoutes = require('./routes/weather');
app.use('/api/weather', weatherRoutes);

const soilRoutes = require('./routes/soil');
app.use('/api/soil', soilRoutes);

const masterCropRoutes = require('./routes/masterCrop');
app.use('/api/master-crops', masterCropRoutes);

const pestRoutes = require('./routes/pest');
app.use('/api/pests', pestRoutes);

const expertRoutes = require('./routes/expert');
app.use('/api/expert', expertRoutes);

const communityRoutes = require('./routes/community');
app.use('/api/community', communityRoutes);

const productRoutes = require('./routes/product');
app.use('/api/products', productRoutes);

const userRoutes = require('./routes/user');
app.use('/api/users', userRoutes);

const adminRoutes = require('./routes/admin');
app.use('/api/admin', adminRoutes);