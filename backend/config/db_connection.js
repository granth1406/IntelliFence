const mongoose = require("mongoose");

async function db_connection() {
    try {
        console.log("[DB] Connecting to MongoDB...");
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("[DB] Connected to MongoDB.");
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}



module.exports = { db_connection };
