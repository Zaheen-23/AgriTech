const mongoose = require('mongoose');
require('dotenv').config(); // Agar .env use kar rahe ho DB URI ke liye
const Product = require('./Models/Product'); // Path check kar lena

const sampleProducts = [
    // Seeds (5 items)
    { name: 'High-Yield Wheat Seeds (HD-2967)', category: 'seeds', price: 650, stock: 120, description: 'Disease-resistant high yield wheat seeds.' },
    { name: 'Basmati Rice Seeds (Pusa 1121)', category: 'seeds', price: 850, stock: 90, description: 'Premium long-grain aromatic rice seeds.' },
    { name: 'Hybrid Maize Seeds', category: 'seeds', price: 450, stock: 150, description: 'Fast-growing drought-tolerant corn seeds.' },
    { name: 'Mustard Seeds (Pusa Bold)', category: 'seeds', price: 300, stock: 80, description: 'High oil content mustard seeds.' },
    { name: 'Cotton BT Seeds', category: 'seeds', price: 950, stock: 60, description: 'Bollworm resistant hybrid cotton seeds.' },

    // Fertilizers (5 items)
    { name: 'DAP Fertilizer (Diammonium Phosphate)', category: 'fertilizers', price: 1350, stock: 200, description: 'Essential phosphorus and nitrogen fertilizer.' },
    { name: 'Urea Fertilizer (46% Nitrogen)', category: 'fertilizers', price: 280, stock: 300, description: 'High-nitrogen granular fertilizer for rapid crop growth.' },
    { name: 'NPK 19:19:19 Water Soluble', category: 'fertilizers', price: 420, stock: 150, description: 'Balanced fertilizer for overall plant nourishment.' },
    { name: 'Zinc Sulphate (21%)', category: 'fertilizers', price: 180, stock: 100, description: 'Corrects zinc deficiency in soil.' },
    { name: 'Muriate of Potash (MOP)', category: 'fertilizers', price: 900, stock: 110, description: 'Potassium-rich fertilizer for root strength.' },

    // Pesticides (5 items)
    { name: 'Glyphosate 41% SL Herbicide', category: 'pesticides', price: 450, stock: 75, description: 'Broad-spectrum systemic herbicide.' },
    { name: 'Neem Oil Organic Pesticide', category: 'pesticides', price: 350, stock: 130, description: 'Natural pest and insect repellent.' },
    { name: 'Chlorpyrifos 20% EC', category: 'pesticides', price: 550, stock: 60, description: 'Effective termiticide and soil insecticide.' },
    { name: 'Imidacloprid 17.8% SL', category: 'pesticides', price: 620, stock: 85, description: 'Controls sucking pests like aphids and jassids.' },
    { name: 'Carbendazim 50% WP Fungicide', category: 'pesticides', price: 400, stock: 95, description: 'Prevents and cures fungal plant diseases.' },

    // Tools (5 items)
    { name: 'Heavy Duty Forged Spade (Phawra)', category: 'tools', price: 450, stock: 40, description: 'Durable steel digging tool with wooden handle.' },
    { name: 'Agricultural Sickle (Hasua)', category: 'tools', price: 150, stock: 70, description: 'Sharp serrated blade for harvesting crops.' },
    { name: 'Knapsack Manual Sprayer (16L)', category: 'tools', price: 1600, stock: 30, description: 'Comfortable backpack sprayer for pesticides/fertilizers.' },
    { name: 'Hand Cultivator (Khurpa)', category: 'tools', price: 120, stock: 100, description: 'Hand tool for weeding and soil loosening.' },
    { name: 'Pruning Secateurs / Garden Shear', category: 'tools', price: 350, stock: 50, description: 'For trimming branches and harvesting fruits.' },

    // Organic Manure (5 items)
    { name: 'Premium Vermicompost (25kg)', category: 'organic manure', price: 400, stock: 180, description: 'Nutrient-rich earthworm compost for soil health.' },
    { name: 'Neem Cake Powder (10kg)', category: 'organic manure', price: 320, stock: 110, description: 'Organic fertilizer and natural soil pest protector.' },
    { name: 'Bone Meal Fertilizer', category: 'organic manure', price: 550, stock: 65, description: 'High phosphorus organic source for root development.' },
    { name: 'Cow Dung Manure (Dry - 30kg)', category: 'organic manure', price: 250, stock: 220, description: 'Traditional organic manure to enrich soil structure.' },
    { name: 'Panchagavya Organic Liquid', category: 'organic manure', price: 300, stock: 90, description: 'Growth promoter and immunity booster for plants.' }
];

const seedDB = async () => {
    try {
        // Apne MongoDB connection string yahan daal dena agar .env mein nahi hai
        const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/agritech';
        
        await mongoose.connect(MONGO_URI);
        console.log('📦 Connected to DB for Seeding...');

        // Purane products hata kar naye daalne ho toh ye line uncomment karo:
        await Product.deleteMany({});
        console.log('🗑️ Cleared existing products.');

        await Product.insertMany(sampleProducts);
        console.log('✅ 25 Sample Products Inserted Successfully!');

        mongoose.connection.close();
    } catch (err) {
        console.error('❌ Seeding Error:', err);
        mongoose.connection.close();
    }
};

seedDB();