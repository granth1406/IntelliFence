const Parser = require("rss-parser");
const parser = new Parser();

const sources = require("../config/newsSources");
const { normalizeArticle } = require("../utils/normalizeArticle");

async function fetchLatestNews() {

    let allArticles = [];

    console.log("[NEWS] Fetching sources...");

    for (const source of sources) {

        try {

            const feed = await parser.parseURL(source.url);

            const articles = (feed.items || []).map(item =>
                normalizeArticle(item, source.name)
            );

            allArticles.push(...articles);

        } catch (error) {

            console.error(
                `[${source.name}]`,
                error.message
            );

        }

    }

    console.log(`[NEWS] Normalized ${allArticles.length} articles.`);

    return allArticles;
}

module.exports = { fetchLatestNews };