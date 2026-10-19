const mongoose = require("mongoose");

const maintenanceSchema = new mongoose.Schema({
  assetId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Asset",
    required: true,
  },

  faultId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FaultReport",
    required: true,
  },

  technician: {
    type: String,
    required: true,
  },

  maintenanceDate: {
    type: String,
    required: true,
  },

  description: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["Pending", "In Progress", "Completed"],
    required: true,
  },
});

module.exports = mongoose.model("Maintenance", maintenanceSchema);
