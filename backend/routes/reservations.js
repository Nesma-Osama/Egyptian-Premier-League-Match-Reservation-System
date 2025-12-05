const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const Reservation = require("../schemas/reservation");
const Match = require("../schemas/match");
const Seat = require("../schemas/seat");

router.get("/", authMiddleware, async (req, res) => {
  try {
    const reservations = await Reservation.find({ user: req.user.id })
      .populate({
        path: "match",
        populate: { path: "stadium" },
      })
      .populate("seats")
      .sort({ createdAt: -1 });
    res.json(reservations);
  } catch (err) {
    console.error("Error while Fetching Reservations", err);
    res.status(500).send({ message: "Server error" });
  }
});

router.post("/", authMiddleware, async (req, res) => {
  try {
    const { matchId, seatIds, totalAmount } = req.body;

    if (!matchId || !seatIds || !Array.isArray(seatIds) || seatIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Please provide matchId and seatIds array",
      });
    }

    const match = await Match.findById(matchId);
    if (!match) {
      return res.status(404).json({
        success: false,
        message: "Match not found",
      });
    }

    if (match.state === "Completed") {
      return res.status(400).json({
        success: false,
        message: "Cannot book seats for completed matches",
      });
    }

    if (new Date(match.matchDate) < new Date()) {
      return res.status(400).json({
        success: false,
        message: "Cannot book seats for past matches",
      });
    }

    const seats = await Seat.find({
      _id: { $in: seatIds },
      match: matchId,
    });

    if (seats.length !== seatIds.length) {
      return res.status(400).json({
        success: false,
        message: "Some seats not found",
      });
    }

    const reservedSeats = seats.filter(seat => seat.state === "reserved");
    if (reservedSeats.length > 0) {
      return res.status(400).json({
        success: false,
        message: "Some seats are already reserved",
      });
    }

    const calculatedAmount = seats.reduce((sum, seat) => sum + seat.ticketPrice, 0);

    const reservation = new Reservation({
      match: matchId,
      user: req.user.id,
      seats: seatIds,
      totalAmount: calculatedAmount,
    });

    await reservation.save();

    await Seat.updateMany(
      { _id: { $in: seatIds } },
      { $set: { state: "reserved" } }
    );

    const populatedReservation = await Reservation.findById(reservation._id)
      .populate({
        path: "match",
        populate: { path: "stadium" },
      })
      .populate("seats");

    res.status(201).json({
      success: true,
      message: "Reservation created successfully",
      data: populatedReservation,
    });
  } catch (err) {
    console.error("Error creating reservation:", err);
    res.status(500).json({
      success: false,
      message: "Error creating reservation",
      error: err.message,
    });
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
      const removedSeat = await Seat.findById(seatId);
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
