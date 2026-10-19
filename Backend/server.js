const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const assetRoutes = require("./routes/assetRoutes");
const laboratoryRoutes = require("./routes/laboratoryRoutes");
const maintenanceRoutes = require("./routes/maintenanceRoutes");
const faultReportRoutes = require("./routes/faultReportRoutes");
const userRoutes = require("./routes/userRoutes");
const authRoutes = require("./routes/authRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");

const app = express();

app.use(cors());
app.use(express.json());

app.use("/api/assets", assetRoutes);
app.use("/api/laboratories", laboratoryRoutes);
app.use("/api/maintenance", maintenanceRoutes);
app.use("/api/fault-reports", faultReportRoutes);
app.use("/api/users", userRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.get("/", (req, res) => {
  res.json({ message: "AssetForge API is running" });
});

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB connected:", mongoose.connection.name);

    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error("MongoDB connection failed:", error.message);
    process.exit(1);
  }
}

startServer();
