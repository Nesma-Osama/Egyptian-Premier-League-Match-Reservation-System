const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const Reservation = require("../schemas/reservation");
const match = require("../schemas/match");
const seat = require("../schemas/seat");
const stadium = require("../schemas/stadium");
router.get("/", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate({
        path: "match",
        populate: { path: "stadium" },
      })
      .populate({ path: "seats" })
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    console.error("Error while Fetching Reservations", err);
    res.status(500).send({ message: "Server error" });
  }
});
router.delete(
  "/:reservationId/seat/:seatId",
  authMiddleware,
  async (req, res) => {
    try {
      const { reservationId, seatId } = req.params;
      const reservation = await Reservation.findById(reservationId).populate(
        "match"
      );
      if (!reservation) {
        return res.status(404).json({ message: "Reservation not found" });
      }
      if (reservation.user.toString() !== req.user.id) {
        return res.status(403).json({ message: "Unauthorized" });
      }
      if (new Date(reservation.match.matchDate) <= new Date()) {
        return res.status(400).json({ message: "Match already started" });
      }
      reservation.seats = reservation.seats.filter(
        (s) => s.toString() !== seatId
      );
      const removedSeat = await seat.findById(seatId);
      if (removedSeat) {
        reservation.totalAmount -= removedSeat.ticketPrice;
        removedSeat.state = "vacant";
        await removedSeat.save();
      }
      await reservation.save();
      if (reservation.seats.length === 0) {
        await Reservation.findByIdAndDelete(reservationId);

        return res.json(null);
      }
      const updated = await Reservation.findById(reservation._id)
        .populate({
          path: "match",
          populate: { path: "stadium" },
        })
        .populate("seats");

      res.json(updated);
    } catch (err) {
      console.error("Cancel Seat Error:", err);
      res.status(500).json({ message: "Server error" });
    }
  }
);

module.exports = router;
