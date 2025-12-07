const express = require("express");
const router = express.Router();
const jwt = require("jsonwebtoken");
const User = require("../schemas/user");
require("dotenv").config();

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user._id,
      username: user.username,
      email: user.email,
      role: user.role,
      isAuthorized: user.isAuthorized,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE }
  );
};

router.post("/register", async (req, res) => {
  try {
    const {
      username,
      password,
      email,
      firstName,
      lastName,
      birthDate,
      gender,
      city,
      address,
      role,
    } = req.body;

    if (
      !username ||
      !password ||
      !email ||
      !firstName ||
      !lastName ||
      !birthDate ||
      !gender ||
      !city
    ) {
      return res.status(400).json({
        success: false,
        message: "Please provide all required fields",
      });
    }

    const existingUser = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "User with this username or email already exists",
      });
    }

    const user = new User({
      username,
      password,
      email,
      firstName,
      lastName,
      birthDate,
      gender,
      city,
      address: address || "",
      role: role || "Fan",
      isAuthorized: false, 
    });

    await user.save();
    const token = generateToken(user);

    res.status(201).json({
      success: true,
      message: "Registration successful. Waiting for admin approval.",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAuthorized: user.isAuthorized,
        birthDate: user.birthDate,
        gender: user.gender,
        city: user.city,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during registration",
      error: error.message,
    });
  }
});

router.post("/login", async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide username and password",
      });
    }

    const user = await User.findOne({
      $or: [{ username }, { email: username }],
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    const isPasswordValid = await user.comparePassword(password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isAuthorized && user.role !== "Admin") {
      return res.status(403).json({
        success: false,
        message:
          "Your account is pending aproval wait for admin authorization",
      });
    }

    const token = generateToken(user);

    res.json({
      success: true,
      message: "Login successful",
      token,
      user: {
        id: user._id,
        username: user.username,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isAuthorized: user.isAuthorized,
        birthDate: user.birthDate,
        gender: user.gender,
        city: user.city,
        address: user.address,
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
      error: error.message,
    });
  }
});

router.get(
  "/me",
  require("../middleware/auth").authMiddleware,
  async (req, res) => {
    try {
      const user = await User.findById(req.user.id).select("-password");
      res.json({
        success: true,
        user,
      });
    } catch (error) {
      console.error("Get user error:", error);
      res.status(500).json({
        success: false,
        message: "Server error",
        error: error.message,
      });
    }
  }
);

module.exports = router;
