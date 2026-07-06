const dotenv = require("dotenv");
dotenv.config();

const { GoogleGenAI } = require("@google/genai");
const { buildBatchPrompt } = require("./prompt");

const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-flash";

async function generateIncidents(articles) {

    const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY
    });

    const prompt = buildBatchPrompt(articles);

    const response = await ai.models.generateContent({
        model: MODEL,
        contents: prompt
    });

    if (!response.text) {
        throw new Error("Empty response from Gemini.");
    }

    let text = response.text.trim();

    text = text
        .replace(/^```json\s*/i, "")
        .replace(/^```\s*/i, "")
        .replace(/\s*```$/, "");

    return JSON.parse(text);
}

module.exports = {
    generateIncidents
};