const cron = require("node-cron");

const { fetchLatestNews } = require("../services/newsService");
const { filterArticles } = require("../utils/articleFilter");

const NewsArticle = require("../models/NewsArticle");

cron.schedule("*/1 * * * *", async () => {

    try {
        const cycleStartedAt = Date.now();
        console.log("[NEWS CRON] Cycle started.");

        const articles = await fetchLatestNews();

        const filteredArticles = filterArticles(articles);

        console.log(
            `[NEWS CRON] Fetched ${articles.length}, matched ${filteredArticles.length}.`
        );

        let inserted = 0;

        for (const article of filteredArticles) {

            try {

                if (!article.sourceUrl) {
                    continue;
                }

                const result = await NewsArticle.updateOne(
                    {
                        sourceUrl: article.sourceUrl
                    },
                    {
                        $setOnInsert: {
                            title: article.title,
                            description: article.description,
                            content: article.content,
                            url: article.sourceUrl,
                            source: article.source,
                            sourceUrl: article.sourceUrl,
                            publishedAt: article.publishedAt,
                            aiProcessed: false
                        }
                    },
                    {
                        upsert: true
                    }
                );

                if (result.upsertedCount > 0) {
                    inserted++;
                }

            } catch (err) {

                console.error("[DB]", err.message);

            }

        }

        console.log(
            `[NEWS CRON] Inserted ${inserted} new articles in ${Date.now() - cycleStartedAt}ms.`
        );

    } catch (err) {

        console.error("[CRON]", err);

    }

});