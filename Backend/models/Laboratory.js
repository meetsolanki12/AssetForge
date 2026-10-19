const mongoose = require("mongoose");

const laboratorySchema = new mongoose.Schema({
  labName: {
    type: String,
    required: true,
  },

  labCode: {
    type: String,
    required: true,
  },

  location: {
    type: String,
    required: true,
  },

  capacity: {
    type: Number,
    required: true,
  },

  status: {
    type: String,
    enum: ["Active", "Inactive"],
    required: true,
  },
});

module.exports = mongoose.model("Laboratory", laboratorySchema);
