const express = require("express");
const Laboratory = require("../models/Laboratory");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = authMiddleware.allowRoles;

const router = express.Router();

router.use(authMiddleware);

// View all laboratories — all logged-in roles
router.get("/", async (req, res) => {
  try {
    const labs = await Laboratory.find();
    res.json(labs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View one laboratory — all logged-in roles
router.get("/:id", async (req, res) => {
  try {
    const lab = await Laboratory.findById(req.params.id);

    if (!lab) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    res.json(lab);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create laboratory — Admin only
router.post("/", allowRoles("Admin"), async (req, res) => {
  try {
    const lab = new Laboratory(req.body);
    const savedLab = await lab.save();
    res.status(201).json(savedLab);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Edit laboratory — Admin only
router.put("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const updatedLab = await Laboratory.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    );

    if (!updatedLab) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    res.json(updatedLab);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete laboratory — Admin only
router.delete("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const deletedLab = await Laboratory.findByIdAndDelete(req.params.id);

    if (!deletedLab) {
      return res.status(404).json({ message: "Laboratory not found" });
    }

    res.json({ message: "Laboratory deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
