function normalizeExpress(item) {

    return {

        title: item.title || "",

        description:
            item.contentSnippet ||
            item.content ||
            item.description ||
            "",

        content:
            item.content ||
            item.contentSnippet ||
            item.description ||
            "",

        sourceUrl:
            item.link ||
            "",

        publishedAt:
            item.isoDate ||
            item.pubDate ||
            null,

        source: "Indian Express"

    };

}

module.exports = { normalizeExpress };