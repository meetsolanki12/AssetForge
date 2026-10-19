const express = require("express");
const Maintenance = require("../models/Maintenance");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = authMiddleware.allowRoles;

const router = express.Router();

// Require login for every maintenance route
router.use(authMiddleware);

// GET all maintenance records — all roles can view
router.get("/", async (req, res) => {
  try {
    const records = await Maintenance.find();
    res.json(records);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET maintenance record by ID — all roles can view
router.get("/:id", async (req, res) => {
  try {
    const record = await Maintenance.findById(req.params.id);

    if (!record) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    res.json(record);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// POST maintenance record — Admin and Lab Assistant
router.post("/", allowRoles("Admin", "Lab Assistant"), async (req, res) => {
  try {
    const record = new Maintenance(req.body);
    const savedRecord = await record.save();

    res.status(201).json(savedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT maintenance record — Admin and Lab Assistant
router.put("/:id", allowRoles("Admin", "Lab Assistant"), async (req, res) => {
  try {
    const updatedRecord = await Maintenance.findByIdAndUpdate(
      req.params.id,
      req.body,
      {
        new: true,
        runValidators: true,
      },
    );

    if (!updatedRecord) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    res.json(updatedRecord);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE maintenance record — Admin only
router.delete("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const deletedRecord = await Maintenance.findByIdAndDelete(req.params.id);

    if (!deletedRecord) {
      return res.status(404).json({
        message: "Maintenance record not found",
      });
    }

    res.json({
      message: "Maintenance record deleted successfully",
    });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
