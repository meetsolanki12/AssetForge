const express = require("express");
const router = express.Router();

const authMiddleware = require("../middleware/authMiddleware");
const Asset = require("../models/Asset");
const Laboratory = require("../models/Laboratory");
const FaultReport = require("../models/FaultReport");
const Maintenance = require("../models/Maintenance");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const [
      totalAssets,
      workingAssets,
      faultyAssets,
      maintenanceAssets,
      totalLabs,
      openFaults,
      pendingMaintenance,
    ] = await Promise.all([
      Asset.countDocuments(),
      Asset.countDocuments({ status: "Working" }),
      Asset.countDocuments({ status: "Faulty" }),
      Asset.countDocuments({ status: "Under Maintenance" }),
      Laboratory.countDocuments(),
      FaultReport.countDocuments({
        status: { $ne: "Resolved" },
      }),
      Maintenance.countDocuments({
        status: { $ne: "Completed" },
      }),
    ]);

    res.json({
      role: req.user.role,
      stats: {
        totalAssets,
        workingAssets,
        faultyAssets,
        maintenanceAssets,
        totalLabs,
        openFaults,
        pendingMaintenance,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      message: "Failed to load dashboard.",
    });
  }
});

module.exports = router;
