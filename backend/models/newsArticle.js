const mongoose = require("mongoose");

const NewsArticleSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: true
        },

        description: String,

        content: String,

        url: {
            type: String
        },

        source: String,

        sourceUrl: {
            type: String,
            unique: true,
            index: true
        },

        publishedAt: Date,

        aiProcessed: {
            type: Boolean,
            default: false,
            index: true
        },

        fetchedAt: {
            type: Date,
            default: Date.now
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model("NewsArticle", NewsArticleSchema);