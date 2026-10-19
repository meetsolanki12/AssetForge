const mongoose = require("mongoose");

const faultReportSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    required: true,
  },

  reportedBy: {
    type: String,
    required: true,
  },

  faultDescription: {
    type: String,
    required: true,
  },

  reportedDate: {
    type: String,
    required: true,
  },

  priority: {
    type: String,
    enum: ["Low", "Medium", "High"],
    default: "Medium",
    required: true,
  },

  status: {
    type: String,
    enum: ["Open", "Under Investigation", "Resolved"],
    required: true,
  },
});

module.exports = mongoose.model("FaultReport", faultReportSchema);
