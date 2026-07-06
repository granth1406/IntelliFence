const crypto = require("crypto");

const User = require("../models/User");
const Zone = require("../models/Zone");
const { geocodeLocation } = require("../utils/geocodeLocation");

const INCIDENT_RADIUS = {
    accident: 0.001,
    traffic_jam: 0.002,
    crime: 0.003,
    suspicious_activity: 0.001,
    medical_emergency: 0.0001,
    natural_disaster: 1,
    other: 0.003,
    fire: 0.002,
    flood: 1,
    earthquake: 1,
    landslide: 0.01,
    explosion: 0.002
};

function buildLocationText(location = {}) {

    return [
        location.place,
        location.city,
        location.state,
        location.country
    ]
        .filter(Boolean)
        .join(", ");

}

function buildFingerprint(incident, latitude, longitude) {

    return crypto.createHash("sha1").update(
        [
            incident.title || "",
            incident.incidentType || "",
            incident.summary || "",
            latitude.toFixed(6),
            longitude.toFixed(6)
        ].join("|")
    ).digest("hex");

}

function mapIncidentType(incidentType = "Other") {

    const normalized = String(incidentType).toLowerCase().replace(/\s+/g, "_");

    const mapping = {
        fire: "fire",
        flood: "flood",
        earthquake: "earthquake",
        landslide: "landslide",
        explosion: "explosion",
        accident: "accident",
        "road_accident": "accident",
        "train_accident": "accident",
        "flight_incident": "accident",
        crime: "crime",
        riot: "crime",
        terrorism: "crime",
        "medical_emergency": "medical_emergency",
        "missing_person": "suspicious_activity",
        "building_collapse": "natural_disaster",
        "chemical_leak": "natural_disaster",
        "power_outage": "other",
        "water_logging": "other",
        "public_safety": "other",
        other: "other"
    };

    return mapping[normalized] || "other";

}

async function getAiOwnerId() {

    const authority = await User.findOne({ role: "authority" }).sort({ createdAt: 1 });

    if (authority) {
        return authority._id;
    }

    const fallbackUser = await User.findOne().sort({ createdAt: 1 });

    return fallbackUser ? fallbackUser._id : null;

}

async function createZoneFromIncident(incident, article) {

    const locationText = buildLocationText(incident.location);

    if (!locationText) {
        return { created: false, reason: "missing_location" };
    }

    const geocoded = await geocodeLocation(locationText);

    if (!geocoded) {
        return { created: false, reason: "geocode_failed", locationText };
    }

    const createdBy = await getAiOwnerId();

    if (!createdBy) {
        return { created: false, reason: "no_user_available", locationText };
    }

    const sourceType = mapIncidentType(incident.incidentType);
    const radius = INCIDENT_RADIUS[sourceType] || INCIDENT_RADIUS.other;
    const fingerprint = buildFingerprint(incident, geocoded.latitude, geocoded.longitude);

    const existing = await Zone.findOne({ fingerprint });

    if (existing) {
        return { created: false, reason: "duplicate", zoneId: existing._id };
    }

    const zone = await Zone.create({
        createdBy,
        source: "ai",
        type: "incident",
        title: incident.title,
        description: incident.summary || article.description || article.title,
        incidentType: sourceType,
        riskLevel:
            incident.severity === "CRITICAL" ? "high" :
            incident.severity === "HIGH" ? "high" :
            incident.severity === "MEDIUM" ? "medium" : "low",
        latitude: geocoded.latitude,
        longitude: geocoded.longitude,
        coordinates: {
            lat: geocoded.latitude,
            lng: geocoded.longitude
        },
        radius,
        locationText,
        confidence: incident.confidence || 0.5,
        fingerprint,
        approved: false,
        status: "ACTIVE",
        sources: [
            {
                name: article.source || "AI",
                url: article.sourceUrl,
                publishedAt: article.publishedAt ? new Date(article.publishedAt) : undefined
            }
        ]
    });

    return { created: true, zone };

}

module.exports = {
    createZoneFromIncident
};