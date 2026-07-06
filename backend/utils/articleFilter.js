function isIncidentKeyword(text = "") {
    const keywords = [
        "fire",
        "blast",
        "explosion",
        "accident",
        "crash",
        "collision",
        "earthquake",
        "flood",
        "landslide",
        "collapse",
        "riot",
        "shooting",
        "murder",
        "robbery",
        "attack",
        "stampede",
        "leak",
        "derail",
        "emergency",
        "death",
        "injured"
    ];

    const lower = text.toLowerCase();

    return keywords.some(k => lower.includes(k));
}

function isNoise(text = "") {
    const noiseKeywords = [
        "cricket",
        "football",
        "match",
        "score",
        "bollywood",
        "movie",
        "actor",
        "stock",
        "sensex",
        "nifty",
        "politics",
        "election",
        "minister",
        "party",
        "tweet",
        "instagram",
        "celebrity"
    ];

    const lower = text.toLowerCase();

    return noiseKeywords.some(k => lower.includes(k));
}

function filterArticles(articles) {

    return articles.filter(article => {

        const text = `
            ${article.title || ""}
            ${article.description || ""}
        `;

        // MUST look like an incident
        const hasIncidentSignal = isIncidentKeyword(text);

        // MUST NOT be noise
        const isNoiseArticle = isNoise(text);

        // final decision
        return hasIncidentSignal && !isNoiseArticle;
    });
}

module.exports = {
    filterArticles
};