function normalizeHindu(item) {

    return {

        title: item.title || "",

        description:
            item.summary ||
            item.contentSnippet ||
            item.content ||
            "",

        content:
            item.content ||
            item.summary ||
            item.contentSnippet ||
            "",

        sourceUrl:
            item.link ||
            "",

        publishedAt:
            item.updated ||
            item.isoDate ||
            item.pubDate ||
            null,

        source: "The Hindu"

    };

}

module.exports = { normalizeHindu };