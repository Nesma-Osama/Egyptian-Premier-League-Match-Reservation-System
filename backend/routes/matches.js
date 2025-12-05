const express = require("express");
const router = express.Router();
const Match = require("../schemas/match");
const Seat = require("../schemas/seat");
const { authMiddleware } = require("../middleware/auth");

router.get("/", async (req, res) => {
  try {
    const matches = await Match.find()
      .populate("stadium")
      .sort({ matchDate: 1 });

    let result = [];

    for (let match of matches) {
      if (!match.stadium) {
        console.warn(`Match ${match._id} has no stadium, skipping...`);
        continue;
      }

      if (match.state === "Scheduled" && match.matchDate < new Date()) {
        match.state = "Completed";
        await match.save();
      }

      const reservedSeats = await Seat.countDocuments({
        match: match._id,
        state: "reserved",
      });

      const totalSeats = match.stadium.vipRows * match.stadium.seatsPerRow;
      const availableSeats = totalSeats - reservedSeats;

      result.push({
        ...match.toObject(),
        reservedSeats,
        totalSeats,
        availableSeats,
      });
    }

    res.status(200).json({
      success: true,
      count: result.length,
      data: result,
    });
  } catch (err) {
    console.error("Error fetching matches:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching matches",
      error: err.message,
    });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const match = await Match.findById(req.params.id).populate("stadium");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (!match.stadium) {
      return res.status(404).json({
        success: false,
        message: "Match stadium not found",
      });
    }

    const reservedSeats = await Seat.countDocuments({
      match: match._id,
      state: "reserved",
    });

    const totalSeats = match.stadium.vipRows * match.stadium.seatsPerRow;
    const availableSeats = totalSeats - reservedSeats;

    res.status(200).json({
      success: true,
      data: {
        ...match.toObject(),
        reservedSeats,
        totalSeats,
        availableSeats,
      },
    });
  } catch (err) {
    console.error("Error fetching match:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching match",
      error: err.message,
    });
  }
});

// GET seats for a specific match
router.get("/:id/seats", authMiddleware, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Verify match exists
    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Get all seats for this match
    const seats = await Seat.find({ match: matchId }).sort({ vipRow: 1, seatNumber: 1 });

    res.status(200).json({
      success: true,
      data: seats,
    });
  } catch (err) {
    console.error("Error fetching seats:", err);
    res.status(500).json({
      success: false,
      message: "Error fetching seats",
      error: err.message,
    });
  }
});

module.exports = router;
