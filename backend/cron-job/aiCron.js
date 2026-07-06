const cron = require("node-cron");

const NewsArticle = require("../models/NewsArticle");
const { extractIncidents } = require("../ai/aiExtractor");
const { createZoneFromIncident } = require("../services/aiZoneService");

const AI_BATCH_SIZE = 20;

let activeRun = null;

async function markArticlesProcessed(articles) {

    await Promise.all(
        articles.map(article =>
            NewsArticle.updateOne(
                {
                    _id: article._id
                },
                {
                    $set: {
                        aiProcessed: true
                    }
                }
            )
        )
    );

}

async function processPendingArticles() {

    if (activeRun) {
        return activeRun;
    }

    activeRun = (async () => {

        const articles = await NewsArticle.find({
            aiProcessed: false
        })
        .sort({ publishedAt: 1 });

        if (articles.length === 0) {
            console.log("[AI CRON] No pending articles.");
            return;
        }

        let incidentCount = 0;
        let processedCount = 0;
        let zoneCount = 0;
        let skippedZones = 0;

        const startedAt = Date.now();
        console.log(
            `[AI CRON] Processing ${articles.length} pending articles in ${AI_BATCH_SIZE}-article batches.`
        );

        for (let start = 0; start < articles.length; start += AI_BATCH_SIZE) {

            const batch = articles.slice(start, start + AI_BATCH_SIZE);

            const incidents = await extractIncidents(batch);

            for (const incident of incidents) {

                const article = batch[incident.index];

                if (!article) continue;

                if (incident.isIncident) {
                    incidentCount++;

                    const result = await createZoneFromIncident(incident, article);

                    if (result.created) {
                        zoneCount++;
                    } else {
                        skippedZones++;
                    }
                }

            }

            await markArticlesProcessed(batch);
            processedCount += batch.length;

        }

        console.log(
            `[AI CRON] Completed ${processedCount} articles, ${incidentCount} incidents, ${zoneCount} zones, ${skippedZones} skipped, ${Date.now() - startedAt}ms.`
        );

    })().finally(() => {
        activeRun = null;
    });

    return activeRun;

}

// Every 2 hours
cron.schedule("*/2 * * * *", async () => {

    if (activeRun) {
        return;
    }

    try {
        console.log("[AI CRON] Job started.");
        await processPendingArticles();

    } catch (err) {

        console.error("[AI CRON]", err);

    }

});

