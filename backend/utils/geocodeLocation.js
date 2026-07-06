const axios = require("axios");

async function geocodeLocation(locationText) {

    const query = (locationText || "").trim();

    if (!query) {
        return null;
    }

    const response = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: {
            format: "jsonv2",
            limit: 1,
            q: query
        },
        headers: {
            "User-Agent": "IntelliFence/1.0"
        },
        timeout: 10000
    });

    const result = response.data?.[0];

    if (!result) {
        return null;
    }

    const latitude = Number(result.lat);
    const longitude = Number(result.lon);

    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
        return null;
    }

    return {
        latitude,
        longitude,
        displayName: result.display_name || query
    };

}

module.exports = {
    geocodeLocation
};