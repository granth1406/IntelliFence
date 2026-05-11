const mongoose = require("mongoose");
const db_var = require('./config/db_connection');

async function clearDatabase() {
    try {
        await db_var.db_connection();

        // Drop entire database
        await mongoose.connection.dropDatabase();
        console.log("Database dropped successfully");

    } catch (error) {
        console.error("Error clearing database:", error);
        throw error;
    }
}

clearDatabase().then(() => {
    mongoose.connection.close(); 
});
