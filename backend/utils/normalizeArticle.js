const { normalizeGoogle } = require("./normalizers/googleNormalizer");
const { normalizeTOI } = require("./normalizers/toiNormalizer");
const { normalizeHindu } = require("./normalizers/hinduNormalizer");
const { normalizeExpress } = require("./normalizers/expressNormalizer");
const { defaultNormalizer } = require("./normalizers/defaultNormalizer");

function normalizeArticle(item, sourceName) {

    switch (sourceName) {

        case "Google News":
            return normalizeGoogle(item);

        case "Times of India":
            return normalizeTOI(item);

        case "The Hindu":
            return normalizeHindu(item);

        case "Indian Express":
            return normalizeExpress(item);

        default:
            return defaultNormalizer(item);

    }

}

module.exports = { normalizeArticle };