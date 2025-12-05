
const express = require("express");
const router = express.Router();
const User = require('../schemas/user');
const { authMiddleware, isManager } = require("../middleware/auth");

// GET user profile
router.get("/profile", authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      data: user,
    });
  } catch (err) {
    console.error("Error fetching user profile:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching profile",
      error: err.message,
    });
  }
});

// UPDATE user profile (except email and username)
router.put("/profile", authMiddleware, async (req, res) => {
  try {
    const {
      firstName,
      lastName,
      birthDate,
      gender,
      city,
      address,
      password,
    } = req.body;

    // Find user
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Update only provided fields
    if (firstName !== undefined && firstName.trim()) {
      user.firstName = firstName.trim();
    }

    if (lastName !== undefined && lastName.trim()) {
      user.lastName = lastName.trim();
    }

    if (birthDate !== undefined && birthDate) {
      const birthDateObj = new Date(birthDate);
      if (isNaN(birthDateObj.getTime())) {
        return res.status(400).json({
          success: false,
          message: "Invalid birth date format",
        });
      }
      user.birthDate = birthDateObj;
    }

    if (gender !== undefined && gender) {
      if (!["M", "F"].includes(gender)) {
        return res.status(400).json({
          success: false,
          message: "Gender must be either 'M' or 'F'",
        });
      }
      user.gender = gender;
    }

    if (city !== undefined && city.trim()) {
      user.city = city.trim();
    }

    if (address !== undefined) {
      user.address = address.trim();
    }

    // Update password if provided
    if (password !== undefined && password) {
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: "Password must be at least 6 characters",
        });
      }
      user.password = password;
    }

    // Save user (password will be hashed by pre-save hook)
    await user.save();

    // Return updated user without password
    const updatedUser = user.toObject();
    delete updatedUser.password;

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: updatedUser,
    });
  } catch (err) {
    console.error("Error updating profile:", err);
    res.status(500).json({
      success: false,
      message: "Error updating profile",
      error: err.message,
    });
  }
});

module.exports = router;
