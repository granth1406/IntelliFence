const { generateIncidents } = require("./aiService");
const { validateResponse } = require("./validateResponse");

async function extractIncidents(articles) {

    try {

        const incidents = await generateIncidents(articles);

        if (!Array.isArray(incidents)) {
            throw new Error("AI did not return an array.");
        }

        return incidents.map(incident => validateResponse(incident));

    } catch (err) {

        throw err;

    }

}

module.exports = {
    extractIncidents
};