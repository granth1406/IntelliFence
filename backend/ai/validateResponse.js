function validateResponse(data) {

    if (!data || typeof data !== "object") {
        throw new Error("Invalid AI response.");
    }

    if (typeof data.index !== "number") {
        throw new Error("Missing article index.");
    }

    if (typeof data.isIncident !== "boolean") {
        throw new Error("Missing isIncident.");
    }

    if (!data.isIncident) {
        return data;
    }

    if (typeof data.title !== "string")
        throw new Error("Missing title.");

    if (typeof data.summary !== "string")
        throw new Error("Missing summary.");

    if (typeof data.incidentType !== "string")
        throw new Error("Missing incident type.");

    if (typeof data.severity !== "string")
        throw new Error("Missing severity.");

    if (
        typeof data.confidence !== "number" ||
        data.confidence < 0 ||
        data.confidence > 1
    ) {
        throw new Error("Invalid confidence.");
    }

    return data;
}

module.exports = {
    validateResponse
};