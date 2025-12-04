const express = require("express");
const router = express.Router();
const { authMiddleware, isManager } = require("../middleware/auth");
const Match = require("../schemas/match");
const Seat = require("../schemas/seat");
router.get("/matches", authMiddleware, isManager, async (req, res) => {
  try {
    const matches = await Match.find({ manager: req.user.id }).populate(
      "stadium"
    );
    let result = [];
    for (let match of matches) {
      if (match.state === "Scheduled" && match.matchDate < new Date()) {
        match.state = "Completed";
        await match.save();
      }
      const reservedSeats = await Seat.find({
        match: match._id,
        state: "reserved",
      });
      const totalRevenue = reservedSeats.reduce(
        (sum, r) => sum + r.ticketPrice,
        0
      );
      result.push({
        ...match.toObject(),
        reservedSeats: reservedSeats.length,
        totalSeats: match.stadium.vipRows * match.stadium.seatsPerRow,
        totalRevenue,
      });
    }
    console.log(result);
    res.json(result);
  } catch (err) {
    console.error("Error while Fetching Matches", err);
    res.status(500).send({ message: "Server error" });
  }
});
module.exports = router;
