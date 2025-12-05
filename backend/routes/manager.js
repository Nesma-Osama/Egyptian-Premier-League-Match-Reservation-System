const express = require("express");
const router = express.Router();
const { authMiddleware, isManager } = require("../middleware/auth");
const Match = require("../schemas/match");
const Seat = require("../schemas/seat");
const Stadium = require("../schemas/stadium");
// GET all matches for a manager
router.get("/matches", authMiddleware, isManager, async (req, res) => {
  try {
    const matches = await Match.find({ manager: req.user.id }).populate(
      "stadium"
    );

    let result = [];

    for (let match of matches) {
      // Auto-update state if match date has passed
      if (match.state === "Scheduled" && match.matchDate < new Date()) {
        match.state = "Completed";
        await match.save();
      }

      // Get reserved seats count
      const reservedSeats = await Seat.find({
        match: match._id,
        state: "reserved",
      });

      // Calculate total revenue
      const totalRevenue = reservedSeats.reduce(
        (sum, seat) => sum + seat.ticketPrice,
        0
      );

      // Calculate total seats
      const totalSeats = match.stadium.vipRows * match.stadium.seatsPerRow;

      result.push({
        ...match.toObject(),
        reservedSeats: reservedSeats.length,
        totalSeats,
        totalRevenue,
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

// GET a single match by ID
router.get("/matches/:id", authMiddleware, isManager, async (req, res) => {
  try {
    const match = await Match.findOne({
      _id: req.params.id,
      manager: req.user.id,
    }).populate("stadium");

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Get reserved seats and revenue
    const reservedSeats = await Seat.find({
      match: match._id,
      state: "reserved",
    });

    const totalRevenue = reservedSeats.reduce(
      (sum, seat) => sum + seat.ticketPrice,
      0
    );

    const totalSeats = match.stadium.vipRows * match.stadium.seatsPerRow;

    res.status(200).json({
      success: true,
      data: {
        ...match.toObject(),
        reservedSeats: reservedSeats.length,
        totalSeats,
        totalRevenue,
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

// CREATE a new match
router.post("/matches", authMiddleware, isManager, async (req, res) => {
  try {
    const { homeTeam, awayTeam, matchDate, stadium, referee, linesmen } =
      req.body;

    // Validate required fields
    if (
      !homeTeam ||
      !awayTeam ||
      !matchDate ||
      !stadium ||
      !referee ||
      !linesmen
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide all required fields: homeTeam, awayTeam, matchDate, stadium, referee, linesmen",
      });
    }

    // Validate stadium exists
    const stadiumDoc = await Stadium.findById(stadium);
    if (!stadiumDoc) {
      return res.status(400).json({
        success: false,
        message: "Invalid stadium ID",
      });
    }

    // Convert linesmen string to array if needed
    let linesArr = linesmen;
    if (typeof linesmen === "string") {
      linesArr = linesmen.split(",").map((s) => s.trim());
    }

    // Create match
    const match = new Match({
      manager: req.user.id,
      homeTeam,
      awayTeam,
      matchDate,
      stadium,
      referee,
      linesmen: linesArr,
    });

    await match.save();

    // Auto-generate seats for the match
    const seats = [];
    for (let row = 1; row <= stadiumDoc.vipRows; row++) {
      for (let seat = 1; seat <= stadiumDoc.seatsPerRow; seat++) {
        seats.push({
          match: match._id,
          vipRow: row,
          seatNumber: seat,
          ticketPrice: 50, // Default ticket price (adjust as needed)
          state: "vacant",
        });
      }
    }

    await Seat.insertMany(seats);

    const populatedMatch = await match.populate("stadium");

    res.status(201).json({
      success: true,
      message: "Match created successfully",
      data: populatedMatch,
    });
  } catch (err) {
    console.error("Error creating match:", err);
    res.status(500).json({
      success: false,
      message: "Error creating match",
      error: err.message,
    });
  }
});

// UPDATE a match
router.put("/matches/:id", authMiddleware, isManager, async (req, res) => {
  try {
    const matchId = req.params.id;
    const { homeTeam, awayTeam, matchDate, stadium, referee, linesmen } =
      req.body;

    // Find match
    const match = await Match.findOne({
      _id: matchId,
      manager: req.user.id,
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Cannot edit completed matches
    if (match.state === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot edit completed matches",
      });
    }

    // Cannot edit past matches
    if (new Date(match.matchDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot edit past matches",
      });
    }

    // Convert linesmen string to array if needed
    let linesArr = linesmen;
    if (typeof linesmen === "string") {
      linesArr = linesmen.split(",").map((s) => s.trim());
    }

    const oldStadium = match.stadium.toString();

    // Update match fields
    match.homeTeam = homeTeam || match.homeTeam;
    match.awayTeam = awayTeam || match.awayTeam;
    match.matchDate = matchDate || match.matchDate;
    match.stadium = stadium || match.stadium;
    match.referee = referee || match.referee;
    match.linesmen = linesArr || match.linesmen;

    await match.save();

    // If stadium changed, regenerate seats
    if (oldStadium !== (stadium || oldStadium)) {
      // Delete old seats
      await Seat.deleteMany({ match: match._id });

      // Get new stadium info
      const stadiumDoc = await Stadium.findById(stadium || oldStadium);

      // Create new seats
      const newSeats = [];
      for (let row = 1; row <= stadiumDoc.vipRows; row++) {
        for (let seat = 1; seat <= stadiumDoc.seatsPerRow; seat++) {
          newSeats.push({
            match: match._id,
            vipRow: row,
            seatNumber: seat,
            ticketPrice: 50,
            state: "vacant",
          });
        }
      }

      await Seat.insertMany(newSeats);
    }

    const updatedMatch = await match.populate("stadium");

    res.status(200).json({
      success: true,
      message: "Match updated successfully",
      data: updatedMatch,
    });
  } catch (err) {
    console.error("Error updating match:", err);
    res.status(500).json({
      success: false,
      message: "Error updating match",
      error: err.message,
    });
  }
});

// DELETE a match
router.delete("/matches/:id", authMiddleware, isManager, async (req, res) => {
  try {
    const matchId = req.params.id;

    // Find match
    const match = await Match.findOne({
      _id: matchId,
      manager: req.user.id,
    });

    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    // Cannot delete completed matches
    if (match.state === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot delete completed matches",
      });
    }

    // Delete all associated seats
    await Seat.deleteMany({ match: match._id });

    // Delete the match
    await Match.findByIdAndDelete(matchId);

    res.status(200).json({
      success: true,
      message: "Match deleted successfully",
    });
  } catch (err) {
    console.error("Error deleting match:", err);
    res.status(500).json({
      success: false,
      message: "Error deleting match",
      error: err.message,
    });
  }
});

module.exports = router;

// Stadium routes  ************************************************************

router.post("/stadiums",authMiddleware, isManager, async (req, res) => {
  try {
    const { name, vipRows, seatsPerRow } = req.body;

    // Validate required fields
    if (!name || !vipRows || !seatsPerRow) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, vipRows, and seatsPerRow",
      });
    }

    // Create new stadium
    const stadium = new Stadium({
      name,
      vipRows,
      seatsPerRow,
    });

    const savedStadium = await stadium.save();

    res.status(201).json({
      success: true,
      message: "Stadium created successfully",
      data: savedStadium,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Stadium with name "${error.keyValue.name}" already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error creating stadium",
      error: error.message,
    });
  }
});

// GET all stadiums
router.get("/stadiums",authMiddleware, isManager, async (req, res) => {
  try {
    const stadiums = await Stadium.find();

    res.status(200).json({
      success: true,
      count: stadiums.length,
      data: stadiums,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stadiums",
      error: error.message,
    });
  }
});

// GET a single stadium by ID
router.get("/stadiums/:id",authMiddleware, isManager, async (req, res) => {
  try {
    const stadium = await Stadium.findById(req.params.id);

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: "Stadium not found",
      });
    }

    res.status(200).json({
      success: true,
      data: stadium,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error fetching stadium",
      error: error.message,
    });
  }
});

// UPDATE a stadium
router.put("/stadiums/:id",authMiddleware, isManager, async (req, res) => {
  try {
    const { name, vipRows, seatsPerRow } = req.body;

    // Find and update stadium
    const stadium = await Stadium.findById(req.params.id);

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: "Stadium not found",
      });
    }

    // Update fields if provided
    if (name) stadium.name = name;
    if (vipRows) stadium.vipRows = vipRows;
    if (seatsPerRow) stadium.seatsPerRow = seatsPerRow;

    const updatedStadium = await stadium.save();

    res.status(200).json({
      success: true,
      message: "Stadium updated successfully",
      data: updatedStadium,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: `Stadium with name "${error.keyValue.name}" already exists`,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error updating stadium",
      error: error.message,
    });
  }
});

// DELETE a stadium
router.delete("/stadiums/:id", authMiddleware, isManager,async (req, res) => {
  try {
    const stadium = await Stadium.findByIdAndDelete(req.params.id);

    if (!stadium) {
      return res.status(404).json({
        success: false,
        message: "Stadium not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Stadium deleted successfully",
      data: stadium,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Error deleting stadium",
      error: error.message,
    });
  }
});

module.exports = router;
