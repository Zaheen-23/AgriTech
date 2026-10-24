const mongoose = require('mongoose');
const dotenv = require('dotenv');
const PestAlert = require('./Models/PestAlert');

dotenv.config();

const pestsData = [
    // 1. Wheat
    {
        pestName: "Yellow Rust (Fungus)",
        affectedCrop: "Wheat",
        season: "Rabi",
        symptoms: "Yellow stripe spots on leaf surface, leading to premature leaf drying.",
        severity: "High",
        treatment: "Spray Propiconazole 25% EC @ 1 ml/liter of water.",
        alertType: "permanent"
    },
    {
        pestName: "Termites",
        affectedCrop: "Wheat",
        season: "Rabi",
        symptoms: "Plants dry up completely and can be easily pulled out from soil.",
        severity: "Medium",
        treatment: "Seed treatment with Chlorpyrifos 20 EC before sowing.",
        alertType: "permanent"
    },

    // 2. Rice / Paddy
    {
        pestName: "Rice Stem Borer",
        affectedCrop: "Paddy / Rice",
        season: "Kharif",
        symptoms: "Drying of central shoot known as 'Dead Heart' and white ear heads.",
        severity: "Critical",
        treatment: "Apply Chlorantraniliprole 0.4% GR in root zone or spray Cartap Hydrochloride.",
        alertType: "permanent"
    },
    {
        pestName: "Brown Plant Hopper (BPH)",
        affectedCrop: "Paddy / Rice",
        season: "Kharif",
        symptoms: "Circular patches of dried up plants called 'hopper burn'.",
        severity: "Critical",
        treatment: "Spray Imidacloprid 17.8% SL or Dinotefuran.",
        alertType: "permanent"
    },

    // 3. Maize
    {
        pestName: "Fall Armyworm",
        affectedCrop: "Maize",
        season: "Kharif",
        symptoms: "Large ragged holes in leaves and sawdust-like frass in whorls.",
        severity: "Critical",
        treatment: "Spray Spinetoram 11.7% SC or Emamectin Benzoate.",
        alertType: "permanent"
    },

    // 4. Pearl Millet / Bajra
    {
        pestName: "Downy Mildew (Green Ear Disease)",
        affectedCrop: "Pearl Millet / Bajra",
        season: "Kharif",
        symptoms: "Yellowish-white streaks on leaves and transformation of floral parts into green leafy structures.",
        severity: "Medium",
        treatment: "Seed dressing with Metalaxyl @ 6g/kg of seeds.",
        alertType: "permanent"
    },

    // 5. Sorghum / Jowar
    {
        pestName: "Shoot Fly",
        affectedCrop: "Sorghum / Jowar",
        season: "Kharif",
        symptoms: "Central shoot dries up producing 'dead hearts' in young seedlings.",
        severity: "High",
        treatment: "Seed treatment with Thiamethoxam 30 FS.",
        alertType: "permanent"
    },

    // 6. Chickpea / Chana
    {
        pestName: "Gram Pod Borer",
        affectedCrop: "Chickpea / Chana",
        season: "Rabi",
        symptoms: "Larvae make circular holes in pods and eat developing grains by inserting head inside.",
        severity: "Critical",
        treatment: "Install pheromone traps @ 5/acre and spray NPV or Emamectin Benzoate.",
        alertType: "permanent"
    },

    // 7. Pigeon Pea / Arhar
    {
        pestName: "Pod Fly",
        affectedCrop: "Pigeon Pea / Tur / Arhar",
        season: "Kharif",
        symptoms: "Grains inside the pods are damaged and turn black with tiny exit holes.",
        severity: "High",
        treatment: "Spray Dimethoate 30 EC at the 50% flowering stage.",
        alertType: "permanent"
    },

    // 8. Green Gram / Moong
    {
        pestName: "Yellow Mosaic Virus (YMV)",
        affectedCrop: "Green Gram / Moong",
        season: "Zaid",
        symptoms: "Bright yellow patches and mottled pattern on leaves, stunted plant growth.",
        severity: "High",
        treatment: "Control whitefly vector by spraying Imidacloprid.",
        alertType: "permanent"
    },

    // 9. Black Gram / Urad
    {
        pestName: "Aphids",
        affectedCrop: "Black Gram / Urad",
        season: "Kharif",
        symptoms: "Sucking cell sap from tender shoots, leaving sticky honeydew secretions.",
        severity: "Medium",
        treatment: "Spray Dimethoate 30 EC or Oxydemeton-methyl.",
        alertType: "permanent"
    },

    // 10. Mustard / Sarson
    {
        pestName: "Mustard Aphid",
        affectedCrop: "Mustard / Sarson",
        season: "Rabi",
        symptoms: "Colonies of green-brown insects sucking sap from inflorescence and leaves.",
        severity: "High",
        treatment: "Spray Dimethoate 30 EC or Thiamethoxam.",
        alertType: "permanent"
    },

    // 11. Soybean
    {
        pestName: "Girdle Beetle",
        affectedCrop: "Soybean",
        season: "Kharif",
        symptoms: "Stem girdling with two parallel rings, causing the upper portion to dry up.",
        severity: "High",
        treatment: "Spray Triazophos 40 EC or Profenofos.",
        alertType: "permanent"
    },

    // 12. Groundnut
    {
        pestName: "Tikka Disease (Leaf Spot)",
        affectedCrop: "Groundnut / Moongfali",
        season: "Kharif",
        symptoms: "Dark circular or irregular spots on leaves surrounded by yellow halo rings.",
        severity: "Medium",
        treatment: "Spray Mancozeb 75% WP or Carbendazim.",
        alertType: "permanent"
    },

    // 13. Sugarcane
    {
        pestName: "Early Shoot Borer",
        affectedCrop: "Sugarcane",
        season: "All-Season",
        symptoms: "Dried central shoots ('dead hearts') during early growth stages of cane.",
        severity: "High",
        treatment: "Soil application of Carbofuran 3G or Chlorantraniliprole.",
        alertType: "permanent"
    },

    // 14. Cotton
    {
        pestName: "Pink Bollworm",
        affectedCrop: "Cotton / Kapas",
        season: "Kharif",
        symptoms: "Rosetted flowers, damaged bolls with larvae feeding inside seeds.",
        severity: "Critical",
        treatment: "Use mating disruption technique, Pheromone traps, and Quinalphos spray.",
        alertType: "permanent"
    },

    // 15. Tea
    {
        pestName: "Red Spider Mite",
        affectedCrop: "Tea",
        season: "All-Season",
        symptoms: "Leaves turn bronze or reddish-brown due to heavy cell sap feeding.",
        severity: "Medium",
        treatment: "Spray Propargite 57 EC or Dicofol.",
        alertType: "permanent"
    },

    // 16. Coffee
    {
        pestName: "Coffee Berry Borer",
        affectedCrop: "Coffee",
        season: "All-Season",
        symptoms: "Tiny pin-like holes on coffee berries causing premature fall or grain damage.",
        severity: "High",
        treatment: "Proper harvesting of Gleanings and spraying Chlorpyrifos.",
        alertType: "permanent"
    },

    // 17. Potato
    {
        pestName: "Late Blight of Potato",
        affectedCrop: "Potato",
        season: "Rabi",
        symptoms: "Water-soaked dark brown/black lesions on leaves and stems under damp conditions.",
        severity: "Critical",
        treatment: "Spray Cymoxanil + Mancozeb or Metalaxyl based fungicides.",
        alertType: "permanent"
    },

    // 18. Tomato
    {
        pestName: "Tomato Fruit Borer",
        affectedCrop: "Tomato",
        season: "All-Season",
        symptoms: "Larvae bore circular holes into green and ripe fruits, feeding inside.",
        severity: "High",
        treatment: "Release Trichogramma egg parasitoids and spray Spinosad.",
        alertType: "permanent"
    },

    // 19. Onion
    {
        pestName: "Onion Thrips",
        affectedCrop: "Onion",
        season: "Rabi",
        symptoms: "Silver-white patches and twisting of leaves with tiny black droppings.",
        severity: "Medium",
        treatment: "Spray Spinosad or Profenofos with a sticker agent.",
        alertType: "permanent"
    },

    // 20. Garlic
    {
        pestName: "Stem Rot",
        affectedCrop: "Garlic / Lahsun",
        season: "Rabi",
        symptoms: "Water-soaked lesions near soil line, rotting of bulbs and yellowing leaves.",
        severity: "High",
        treatment: "Seed treatment with Trichoderma viride or Carbendazim.",
        alertType: "permanent"
    },

    // 21. Ginger
    {
        pestName: "Soft Rot",
        affectedCrop: "Ginger / Adrak",
        season: "Kharif",
        symptoms: "Yellowing of lower leaves followed by rotting of rhizomes at soil level.",
        severity: "Critical",
        treatment: "Ensure proper drainage and drenching with Copper Oxychloride.",
        alertType: "permanent"
    },

    // 22. Okra / Bhindi
    {
        pestName: "Yellow Vein Mosaic Virus",
        affectedCrop: "Okra / Bhindi",
        season: "Kharif",
        symptoms: "Network of veins turns completely yellow while green areas remain normal.",
        severity: "High",
        treatment: "Control whitefly vectors using Neem oil or Imidacloprid.",
        alertType: "permanent"
    },

    // 23. Banana
    {
        pestName: "Panama Wilt",
        affectedCrop: "Banana",
        season: "All-Season",
        symptoms: "Yellowing of older leaves starting from margins, splitting of pseudostem base.",
        severity: "Critical",
        treatment: "Use disease-free tissue culture plants and apply Carbendazim drench.",
        alertType: "permanent"
    },

    // --- EMERGENCY STATE-WIDE ALERTS ---
    {
        pestName: "Massive Locust Swarm Attack Alert",
        affectedCrop: "Wheat",
        season: "Rabi",
        symptoms: "Huge flying insect swarms devouring entire crop foliage within minutes.",
        severity: "Critical",
        treatment: "Emergency government-led aerial and community spraying of Chlorpyrifos.",
        alertType: "emergency"
    }
];

const seedPestsDatabase = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/agritech');
        console.log("Connecting to MongoDB for Pest Seeding...");

        await PestAlert.deleteMany();
        await PestAlert.insertMany(pestsData);

        console.log(`✅ Successfully loaded ${pestsData.length} comprehensive Crop Pests into MongoDB!`);
        process.exit(0);
    } catch (err) {
        console.error("❌ Pest Seeding Failed:", err);
        process.exit(1);
    }
};

seedPestsDatabase();