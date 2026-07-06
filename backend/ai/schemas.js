const INCIDENT_TYPES = [
    "Fire",
    "Road Accident",
    "Crime",
    "Flood",
    "Earthquake",
    "Building Collapse",
    "Explosion",
    "Chemical Leak",
    "Power Outage",
    "Water Logging",
    "Terrorism",
    "Riot",
    "Landslide",
    "Train Accident",
    "Flight Incident",
    "Medical Emergency",
    "Missing Person",
    "Public Safety",
    "Other"
];

const SEVERITY_LEVELS = [
    "LOW",
    "MEDIUM",
    "HIGH",
    "CRITICAL"
];

const AI_RESPONSE_SCHEMA = {
    isIncident: "boolean",
    title: "string",
    summary: "string",
    incidentType: "string",
    severity: "string",
    confidence: "number",
    occurredAt: "string",
    location: {
        place: "string",
        city: "string",
        state: "string",
        country: "string"
    },
    casualties: {
        deaths: "number",
        injured: "number",
        missing: "number"
    },
    peopleAffected: "number",
    requiresEmergency: "boolean",
    keywords: ["string"]
};

module.exports = {
    INCIDENT_TYPES,
    SEVERITY_LEVELS,
    AI_RESPONSE_SCHEMA
};