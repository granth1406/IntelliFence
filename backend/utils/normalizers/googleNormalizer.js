function normalizeGoogle(item) {

    return {

        title: item.title || "",

        description:
            item.contentSnippet ||
            item.content ||
            "",

        content:
            item.content ||
            item.contentSnippet ||
            "",

        sourceUrl:
            item.link ||
            "",

        publishedAt:
            item.isoDate ||
            item.pubDate ||
            null,

        source: "Google News"

    };

}

module.exports = { normalizeGoogle };