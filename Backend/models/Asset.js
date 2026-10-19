const mongoose = require("mongoose");

const assetSchema = new mongoose.Schema({
  assetName: {
    type: String,
    required: true,
  },

  assetType: {
    type: String,
    required: true,
  },

  workstationNo: {
    type: String,
    required: true,
  },

  status: {
    type: String,
    enum: ["Working", "Faulty", "Under Maintenance"],
    required: true,
  },

  labId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Laboratory",
    required: true,
  },

  purchaseDate: {
    type: String,
    required: true,
  },
});

module.exports = mongoose.model("Asset", assetSchema);
