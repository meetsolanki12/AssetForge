const express = require("express");
const Asset = require("../models/Asset");
const authMiddleware = require("../middleware/authMiddleware");
const allowRoles = authMiddleware.allowRoles;

const router = express.Router();

router.use(authMiddleware);

// View all assets — all logged-in roles
router.get("/", async (req, res) => {
  try {
    const assets = await Asset.find();
    res.json(assets);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// View one asset — all logged-in roles
router.get("/:id", async (req, res) => {
  try {
    const asset = await Asset.findById(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Create asset — Admin only
router.post("/", allowRoles("Admin"), async (req, res) => {
  try {
    const asset = new Asset(req.body);
    const savedAsset = await asset.save();

    res.status(201).json(savedAsset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update asset details — Admin only
router.put("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json(asset);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update asset status — Admin and Lab Assistant only
router.patch(
  "/:id/status",
  allowRoles("Admin", "Lab Assistant"),
  async (req, res) => {
    try {
      const allowedStatuses = ["Working", "Faulty", "Under Maintenance"];

      if (!allowedStatuses.includes(req.body.status)) {
        return res.status(400).json({
          message: "Please provide a valid asset status.",
        });
      }

      const asset = await Asset.findById(req.params.id);

      if (!asset) {
        return res.status(404).json({ message: "Asset not found" });
      }

      asset.status = req.body.status;
      await asset.save();

      res.json({
        message: "Asset status updated successfully",
        asset,
      });
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  },
);

// Delete asset — Admin only
router.delete("/:id", allowRoles("Admin"), async (req, res) => {
  try {
    const asset = await Asset.findByIdAndDelete(req.params.id);

    if (!asset) {
      return res.status(404).json({ message: "Asset not found" });
    }

    res.json({ message: "Asset deleted successfully" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
