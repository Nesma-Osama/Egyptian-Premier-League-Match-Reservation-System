const express = require("express");
const cors = require("cors");
const connectDB = require("./config/db");
const authRoutes = require("./routes/auth");
const adminRoutes = require("./routes/admin");
const reservations = require("./routes/reservations");
const manager = require("./routes/manager");
const users = require("./routes/users");
const matches = require("./routes/matches");
// const createDummy=require("./config/createDummy")
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// START APP ONLY AFTER DB CONNECTS
const startServer = async () => {
  await connectDB(); // ⬅️ WAIT for DB

  // Now DB is connected → safe to mount routes
  app.use("/api/auth", authRoutes);
  app.use("/api/admin", adminRoutes);
  app.use("/api/reservations", reservations);
  app.use("/api/manager", manager);
  app.use("/api/users", users);
  app.use("/api/matches", matches);

  console.log("Auth routes mounted at /api/auth");
  console.log("Admin routes mounted at /api/admin");

  app.get("/api/test", (req, res) => {
    res.json({ message: "API is working!" });
  });

  app.get("/", (req, res) => {
    res.json({ message: "Egyptian Premier League API" });
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
};

startServer();  // ⬅️ FIXED
