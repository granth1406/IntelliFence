const mongoose = require("mongoose");

const caseRecordSchema = new mongoose.Schema(
  {
    originalZoneId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Zone",
      required: true,
    },
    caseStatus: {
      type: String,
      enum: ["resolved", "denied"],
      required: true,
    },
    handledBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    zoneSnapshot: {
      title: String,
      description: String,
      incidentType: String,
      riskLevel: String,
      latitude: Number,
      longitude: Number,
      radius: Number,
      status: String,
      approved: Boolean,
      createdAt: Date,
      updatedAt: Date,
    },
    handledAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CaseRecord", caseRecordSchema);