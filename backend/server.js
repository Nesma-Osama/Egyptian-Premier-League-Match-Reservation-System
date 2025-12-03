const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const reservations = require("./routes/reservations");
//const createDummy=require("./config/createDummy")
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect to database
connectDB();

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/reservations", reservations);
console.log("Auth routes mounted at /api/auth");
console.log("Admin routes mounted at /api/admin");

// Test route
app.get("/api/test", (req, res) => {
  res.json({ message: "API is working!" });
});

// Basic route
app.get("/", (req, res) => {
  res.json({ message: "Egyptian Premier League API" });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
