const mongoose = require("mongoose");

const zoneSchema = new mongoose.Schema(
  {
    /* =========================
       ORIGIN / OWNERSHIP
    ========================== */

    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },

    source: {
      type: String,
      enum: ["user", "news", "ai", "system"],
      default: "user"
    },

    /* =========================
       CORE INCIDENT DATA
    ========================== */

    type: {
      type: String,
      enum: ["incident", "zone"],
      default: "incident"
    },

    title: {
      type: String,
      required: true,
      trim: true
    },

    description: {
      type: String,
      required: true
    },

    incidentType: {
      type: String,
      enum: [
        "accident",
        "traffic_jam",
        "crime",
        "suspicious_activity",
        "medical_emergency",
        "natural_disaster",
        "fire",
        "flood",
        "earthquake",
        "landslide",
        "explosion",
        "other"
      ],
      default: "other"
    },

    riskLevel: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium"
    },

    /* =========================
       LOCATION DATA
    ========================== */

    latitude: Number,
    longitude: Number,

    coordinates: {
      type: {
        lat: Number,
        lng: Number
      }
    },

    hexagonVertices: [
      {
        lat: Number,
        lng: Number,
        _id: false
      }
    ],

    radius: {
      type: Number,
      default: 0.003
    },

    locationText: {
      type: String
    },

    /* =========================
       LIFECYCLE / STATUS
    ========================== */

    status: {
      type: String,
      enum: ["ACTIVE", "RESOLVED", "EXPIRED"],
      default: "ACTIVE"
    },

    expiresAt: {
      type: Date
    },

    alertLevel: {
      type: String,
      enum: ["none", "near", "inside"],
      default: "none"
    },

    /* =========================
       AI + CONFIDENCE SYSTEM
    ========================== */

    confidence: {
      type: Number,
      default: 0.5,
      min: 0,
      max: 1
    },

    fingerprint: {
      type: String,
      unique: true,
      index: true
    },

    /* =========================
       VERIFICATION SYSTEM
    ========================== */

    approved: {
      type: Boolean,
      default: false
    },

    verificationScore: {
      type: Number,
      default: 0
    },

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

    userResponses: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User"
        },
        response: {
          type: String,
          enum: ["ok", "not_ok"]
        },
        timestamp: {
          type: Date,
          default: Date.now
        }
      }
    ],

    /* =========================
       SOURCE TRACKING (NEWS/AUTHORITY)
    ========================== */

    sources: [
      {
        name: String,
        url: String,
        publishedAt: Date
      }
    ]
  },
  { timestamps: true }
);

module.exports = mongoose.model("Zone", zoneSchema);