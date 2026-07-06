const mongoose = require("mongoose");

const caseRecordSchema = new mongoose.Schema(
{
    /* =========================
       REFERENCES
    ========================== */

    originalZoneId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Zone",
        required: true
    },

    handledBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },

    /* =========================
       CASE STATUS
    ========================== */

    caseStatus: {
        type: String,
        enum: [
            "resolved",
            "denied",
            "expired",
            "merged",
            "archived"
        ],
        required: true
    },

    resolutionNotes: {
        type: String
    },

    /* =========================
       SNAPSHOT OF ORIGINAL ZONE
    ========================== */

    zoneSnapshot: {

        source: String,

        type: String,

        title: String,

        description: String,

        incidentType: String,

        riskLevel: String,

        status: String,

        approved: Boolean,

        confidence: Number,

        verificationScore: Number,

        fingerprint: String,

        latitude: Number,

        longitude: Number,

        locationText: String,

        radius: Number,

        hexagonVertices: [
            {
                lat: Number,
                lng: Number,
                _id: false
            }
        ],

        alertLevel: String,

        expiresAt: Date,

        createdAt: Date,

        updatedAt: Date
    },

    /* =========================
       NEWS SOURCES
    ========================== */

    sources: [
        {
            name: String,
            url: String,
            publishedAt: Date
        }
    ],

    /* =========================
       USER VERIFICATION SNAPSHOT
    ========================== */

    confirmations: [
        {
            user: {
                type: mongoose.Schema.Types.ObjectId,
                ref: "User"
            },
            response: {
                type: String,
                enum: ["confirm", "reject"]
            }
        }
    ],

    verificationScore: Number,

    /* =========================
       METADATA
    ========================== */

    handledAt: {
        type: Date,
        default: Date.now
    }

},
{
    timestamps: true
});

module.exports = mongoose.model("CaseRecord", caseRecordSchema);