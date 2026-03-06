const mongoose = require("mongoose");

async function db_connection() {
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log('MongoDB Connected');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}

module.exports = { db_connection };
