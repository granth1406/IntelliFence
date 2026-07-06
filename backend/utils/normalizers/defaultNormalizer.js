function defaultNormalizer(item) {

    return {

        title: item.title || "",

        description:
            item.contentSnippet ||
            item.content ||
            item.description ||
            item.summary ||
            "",

        content:
            item.content ||
            item.contentSnippet ||
            item.description ||
            item.summary ||
            "",

        sourceUrl:
            item.link ||
            "",

        publishedAt:
            item.isoDate ||
            item.pubDate ||
            item.updated ||
            null,

        source: "Unknown"

    };

}

module.exports = { defaultNormalizer };