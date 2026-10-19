const express = require("express");
const FaultReport = require("../models/FaultReport");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = authMiddleware.allowRoles;

const router = express.Router();

// Require login for every fault report route
router.use(authMiddleware);

// GET all fault reports — all logged-in roles can view
router.get("/", async (req, res) => {
  try {
    const faults = await FaultReport.find();
    res.json(faults);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET fault report by ID — all logged-in roles can view
router.get("/:id", async (req, res) => {
  try {
    const fault = await FaultReport.findById(req.params.id);

    if (!fault) {
      return res.status(404).json({ message: "Fault report not found" });
    }

    res.json(fault);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST fault report — Admin and Lab Assistant
router.post("/", allowRoles("Admin", "Lab Assistant"), async (req, res) => {
  try {
    const fault = new FaultReport(req.body);
    const savedFault = await fault.save();

    res.status(201).json(savedFault);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT fault report — Admin and Lab Assistant
router.put("/:id", allowRoles("Admin", "Lab Assistant"), async (req, res) => {
  try {
    const updatedFault = await FaultReport.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedFault) {
      return res.status(404).json({ message: "Fault report not found" });
    }

    res.json(updatedFault);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE fault report — Admin only
router.delete("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const deletedFault = await FaultReport.findByIdAndDelete(req.params.id);

    if (!deletedFault) {
      return res.status(404).json({ message: "Fault report not found" });
    }

    res.json({ message: "Fault report deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
