const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Crop = require('./Models/masterCrop');

dotenv.config();

const cropsData = [
    // --- CEREALS & MILLETS ---
    { 
      cropName: "Wheat (गेहूँ)", 
      category: "Cereal", 
      season: "Rabi", 
      durationInDays: 120, 
      idealSoilType: ["Loam", "Clay Loam"], 
      expectedYieldPerAcre: "18-22 Quintals", 
      waterRequirement: "Medium",
      idealTemperature: "12°C - 25°C",
      commonPests: ["Yellow Rust", "Aphids", "Termites"],
      recommendedFertilizer: "Urea, DAP, Zinc Sulphate",
      soilPhRange: "6.0 - 7.5"
    },
    { 
      cropName: "Paddy / Rice (धान)", 
      category: "Cereal", 
      season: "Kharif", 
      durationInDays: 140, 
      idealSoilType: ["Clay", "Clay Loam"], 
      expectedYieldPerAcre: "20-25 Quintals", 
      waterRequirement: "High",
      idealTemperature: "20°C - 35°C",
      commonPests: ["Stem Borer", "Leaf Folder", "Brown Plant Hopper"],
      recommendedFertilizer: "NPK 10:26:26, Urea",
      soilPhRange: "5.5 - 6.5"
    },
    { 
      cropName: "Maize (मक्का)", 
      category: "Cereal", 
      season: "Kharif", 
      durationInDays: 100, 
      idealSoilType: ["Well-drained Loam"], 
      expectedYieldPerAcre: "25-30 Quintals", 
      waterRequirement: "Medium",
      idealTemperature: "18°C - 27°C",
      commonPests: ["Fall Armyworm", "Shoot Fly"],
      recommendedFertilizer: "NPK 12:32:16, Zinc",
      soilPhRange: "5.8 - 7.0"
    },
    { 
      cropName: "Pearl Millet / Bajra (बाजरा)", 
      category: "Cereal", 
      season: "Kharif", 
      durationInDays: 85, 
      idealSoilType: ["Sandy", "Light Loam"], 
      expectedYieldPerAcre: "10-14 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "25°C - 35°C", 
      commonPests: ["Downy Mildew", "Ergot"], 
      recommendedFertilizer: "Urea, SSP", 
      soilPhRange: "6.5 - 7.5" 
    },
    { 
      cropName: "Sorghum / Jowar (ज्वार)", 
      category: "Cereal", 
      season: "Kharif", 
      durationInDays: 110, 
      idealSoilType: ["Clayey", "Loam"], 
      expectedYieldPerAcre: "12-16 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "26°C - 32°C", 
      commonPests: ["Shoot Fly", "Stem Borer"], 
      recommendedFertilizer: "NPK 20:20:0", 
      soilPhRange: "6.0 - 8.5" 
    },

    // --- PULSES (DALES) ---
    { 
      cropName: "Chickpea / Chana (चना)", 
      category: "Pulses", 
      season: "Rabi", 
      durationInDays: 110, 
      idealSoilType: ["Silt Clay Loam"], 
      expectedYieldPerAcre: "8-12 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "15°C - 25°C", 
      commonPests: ["Pod Borer", "Wilt"], 
      recommendedFertilizer: "DAP, Single Super Phosphate", 
      soilPhRange: "6.0 - 7.5" 
    },
    { 
      cropName: "Pigeon Pea / Tur / Arhar (अरहर)", 
      category: "Pulses", 
      season: "Kharif", 
      durationInDays: 180, 
      idealSoilType: ["Loam", "Sandy Loam"], 
      expectedYieldPerAcre: "6-9 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "20°C - 30°C", 
      commonPests: ["Pod Fly", "Plume Moth"], 
      recommendedFertilizer: "DAP, Gypsum", 
      soilPhRange: "6.5 - 7.5" 
    },
    { 
      cropName: "Green Gram / Moong (मूंग)", 
      category: "Pulses", 
      season: "Zaid", 
      durationInDays: 60, 
      idealSoilType: ["Sandy Loam"], 
      expectedYieldPerAcre: "4-6 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "25°C - 35°C", 
      commonPests: ["Whitefly", "Yellow Mosaic Virus"], 
      recommendedFertilizer: "DAP", 
      soilPhRange: "6.5 - 7.5" 
    },
    { 
      cropName: "Black Gram / Urad (उड़द)", 
      category: "Pulses", 
      season: "Kharif", 
      durationInDays: 75, 
      idealSoilType: ["Heavy Clay", "Loam"], 
      expectedYieldPerAcre: "5-7 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "25°C - 35°C", 
      commonPests: ["Aphis", "Pod Borer"], 
      recommendedFertilizer: "NPK 18:46:0", 
      soilPhRange: "6.5 - 7.8" 
    },

    // --- OILSEEDS ---
    { 
      cropName: "Mustard / Sarson (सरसों)", 
      category: "Oilseed", 
      season: "Rabi", 
      durationInDays: 110, 
      idealSoilType: ["Sandy Loam"], 
      expectedYieldPerAcre: "8-10 Quintals", 
      waterRequirement: "Low", 
      idealTemperature: "10°C - 25°C", 
      commonPests: ["Mustard Aphid", "White Rust"], 
      recommendedFertilizer: "Single Super Phosphate, Urea", 
      soilPhRange: "6.0 - 7.5" 
    },
    { 
      cropName: "Soybean (सोयाबीन)", 
      category: "Oilseed", 
      season: "Kharif", 
      durationInDays: 100, 
      idealSoilType: ["Well-drained Black Soil"], 
      expectedYieldPerAcre: "10-15 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "20°C - 30°C", 
      commonPests: ["Girdle Beetle", "Tobacco Caterpillar"], 
      recommendedFertilizer: "DAP, MOP", 
      soilPhRange: "6.0 - 7.5" 
    },
    { 
      cropName: "Groundnut / Moongfali (मूंगफली)", 
      category: "Oilseed", 
      season: "Kharif", 
      durationInDays: 120, 
      idealSoilType: ["Sandy Loam", "Red Soil"], 
      expectedYieldPerAcre: "12-15 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "22°C - 30°C", 
      commonPests: ["Tikka Disease", "White Grub"], 
      recommendedFertilizer: "Gypsum, DAP", 
      soilPhRange: "6.0 - 6.5" 
    },

    // --- CASH CROPS (Expanded) ---
    { 
      cropName: "Sugarcane (गन्ना)", 
      category: "Cash Crop", 
      season: "All-Season", 
      durationInDays: 360, 
      idealSoilType: ["Alluvial", "Deep Black"], 
      expectedYieldPerAcre: "300-400 Quintals", 
      waterRequirement: "High", 
      idealTemperature: "20°C - 38°C", 
      commonPests: ["Early Shoot Borer", "Pyrilla"], 
      recommendedFertilizer: "Urea, Potash, SSP", 
      soilPhRange: "6.5 - 7.5" 
    },
    { 
      cropName: "Cotton / Kapas (कपास)", 
      category: "Cash Crop", 
      season: "Kharif", 
      durationInDays: 180, 
      idealSoilType: ["Black Cotton Soil"], 
      expectedYieldPerAcre: "10-12 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "21°C - 30°C", 
      commonPests: ["Pink Bollworm", "Whitefly"], 
      recommendedFertilizer: "NPK 20:20:0", 
      soilPhRange: "6.0 - 8.0" 
    },
    { 
      cropName: "Tea (चाय)", 
      category: "Cash Crop", 
      season: "All-Season", 
      durationInDays: 365, 
      idealSoilType: ["Deep, Friable Loam", "Acidic Soil"], 
      expectedYieldPerAcre: "15-20 Quintals (Processed)", 
      waterRequirement: "High", 
      idealTemperature: "20°C - 30°C", 
      commonPests: ["Red Spider Mite", "Tea Mosquito Bug"], 
      recommendedFertilizer: "Ammonium Sulphate, Nitrogen", 
      soilPhRange: "4.5 - 5.5" 
    },
    { 
      cropName: "Coffee (कॉफ़ी)", 
      category: "Cash Crop", 
      season: "All-Season", 
      durationInDays: 365, 
      idealSoilType: ["Rich Well-Drained Loamy Soil"], 
      expectedYieldPerAcre: "6-8 Quintals", 
      waterRequirement: "High", 
      idealTemperature: "15°C - 28°C", 
      commonPests: ["Coffee Berry Borer", "White Stem Borer"], 
      recommendedFertilizer: "NPK Mix, Organic Compost", 
      soilPhRange: "6.0 - 6.5" 
    },

    // --- VEGETABLES & SPICES ---
    { 
      cropName: "Potato (आलू)", 
      category: "Vegetable", 
      season: "Rabi", 
      durationInDays: 90, 
      idealSoilType: ["Sandy Loam"], 
      expectedYieldPerAcre: "100-120 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "15°C - 20°C", 
      commonPests: ["Late Blight", "Aphids"], 
      recommendedFertilizer: "NPK 12:32:16", 
      soilPhRange: "5.2 - 6.4" 
    },
    { 
      cropName: "Tomato (टमाटर)", 
      category: "Vegetable", 
      season: "All-Season", 
      durationInDays: 120, 
      idealSoilType: ["Well-drained Loam"], 
      expectedYieldPerAcre: "150-200 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "20°C - 27°C", 
      commonPests: ["Fruit Borer", "Early Blight"], 
      recommendedFertilizer: "NPK, Calcium Nitrate", 
      soilPhRange: "6.0 - 7.0" 
    },
    { 
      cropName: "Onion (प्याज)", 
      category: "Vegetable", 
      season: "Rabi", 
      durationInDays: 130, 
      idealSoilType: ["Sandy Loam", "Alluvial"], 
      expectedYieldPerAcre: "80-100 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "13°C - 24°C", 
      commonPests: ["Thrips", "Purple Blotch"], 
      recommendedFertilizer: "Sulphur, NPK", 
      soilPhRange: "6.0 - 7.0" 
    },
    { 
      cropName: "Garlic / Lahsun (लहसुन)", 
      category: "Spices", 
      season: "Rabi", 
      durationInDays: 140, 
      idealSoilType: ["Loamy Soil"], 
      expectedYieldPerAcre: "30-40 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "12°C - 24°C", 
      commonPests: ["Thrips", "Stem Rot"], 
      recommendedFertilizer: "Organic Compost, NPK", 
      soilPhRange: "6.0 - 7.0" 
    },
    { 
      cropName: "Ginger / Adrak (अदरक)", 
      category: "Spices", 
      season: "Kharif", 
      durationInDays: 210, 
      idealSoilType: ["Sandy Loam"], 
      expectedYieldPerAcre: "60-80 Quintals", 
      waterRequirement: "High", 
      idealTemperature: "19°C - 28°C", 
      commonPests: ["Soft Rot", "Shoot Borer"], 
      recommendedFertilizer: "Neem Cake, NPK", 
      soilPhRange: "5.5 - 6.5" 
    },
    { 
      cropName: "Okra / Bhindi (भिंडी)", 
      category: "Vegetable", 
      season: "Kharif", 
      durationInDays: 90, 
      idealSoilType: ["Sandy Loam to Clayey Loam"], 
      expectedYieldPerAcre: "50-60 Quintals", 
      waterRequirement: "Medium", 
      idealTemperature: "22°C - 35°C", 
      commonPests: ["Yellow Vein Mosaic", "Shoot and Fruit Borer"], 
      recommendedFertilizer: "Urea, SSP", 
      soilPhRange: "6.0 - 7.5" 
    },

    // --- FRUITS ---
    { 
      cropName: "Banana (केला)", 
      category: "Fruit", 
      season: "All-Season", 
      durationInDays: 360, 
      idealSoilType: ["Deep Rich Clay Loam"], 
      expectedYieldPerAcre: "250-300 Quintals", 
      waterRequirement: "High", 
      idealTemperature: "15°C - 35°C", 
      commonPests: ["Panama Wilt", "Banana Weevil"], 
      recommendedFertilizer: "Potash, Organic Manure", 
      soilPhRange: "6.0 - 7.5" 
    }
];

const seedCropsDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritech');
        console.log("Connecting to MongoDB...");

        await Crop.deleteMany();
        await Crop.insertMany(cropsData);

        console.log(`✅ Successfully loaded ${cropsData.length} Master Crops into MongoDB!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Crop Seeding Failed:", err);
        process.exit(1);
    }
};

seedCropsDatabase();
