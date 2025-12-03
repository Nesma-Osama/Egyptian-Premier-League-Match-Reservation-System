// seed.js
const mongoose = require("mongoose");
const Stadium = require("../schemas/stadium");
const Match = require("../schemas/match");
const Seat = require("../schemas/seat");
const Reservation = require("../schemas/reservation");
const User = require("../schemas/user"); 
const MONGO_URI = "mongodb://127.0.0.1:27017/epl_reservation";

async function seed() {
  try {
    await Stadium.deleteMany({});
    await Match.deleteMany({});
    await Seat.deleteMany({});
    await Reservation.deleteMany({});
    console.log("Old data cleared");

    const stadiums = await Stadium.insertMany([
      { name: "Cairo International Stadium", vipRows: 3, seatsPerRow: 10 },
      { name: "Alexandria Stadium", vipRows: 3, seatsPerRow: 10 },
    ]);
    console.log("Stadiums inserted");
    let manager = await User.findOne({ role: "Manager" });
    const matches = await Match.insertMany([
      {
        manager: manager._id,
        homeTeam: 1,
        awayTeam: 2,
        stadium: stadiums[0]._id,
        matchDate: new Date("2025-12-10T18:00:00Z"),
        referee: "Ahmed Hassan",
        linesmen: ["Mohamed Ali", "Omar Salah"],
      },
      {
        manager: manager._id,
        homeTeam: 3,
        awayTeam: 4,
        stadium: stadiums[1]._id,
        matchDate: new Date("2025-12-12T20:00:00Z"),
        referee: "Hossam Eldin",
        linesmen: ["Tamer Mahmoud", "Khaled Samir"],
      },
      {
        manager: manager._id,
        homeTeam: 3,
        awayTeam: 4,
        stadium: stadiums[1]._id,
        matchDate: new Date("2025-12-01T20:00:00Z"),
        referee: "Hossam Eldin",
        linesmen: ["Tamer Mahmoud", "Khaled Samir"],
      },
    ]);
    console.log("Matches inserted");
    let seats = [];
    for (let match of matches) {
      for (let row = 1; row <= 3; row++) {
        for (let num = 1; num <= 10; num++) {
          seats.push({
            match: match._id,
            vipRow: row,
            seatNumber: num,
            state: "vacant",
            ticketPrice: row === 1 ? 100 : 50,
          });
          console.log(seats);
        }
      }
      console.log("here");
    }

    console.log(seats);
    const createdSeats = await Seat.insertMany(seats);
    console.log("Seats inserted");
    let user = await User.findOne({ username: "Ahmed21" });
    if (!user) {
      // create dummy user
      user = await User.create({
        username: "testuser",
        firstName: "Test",
        lastName: "User",
        email: "test@example.com",
        password: "123456",
        role: "User",
        isAuthorized: true,
      });
    }
    const firstMatchSeats = createdSeats
      .filter((s) => s.match.toString() === matches[0]._id.toString())
      .slice(0, 3);
    await Reservation.create({
      match: matches[0]._id,
      user: user._id,
      seats: firstMatchSeats.map((s) => s._id),
      totalAmount: firstMatchSeats.reduce((sum, s) => sum + s.ticketPrice, 0),
    });
    await Reservation.create({
      match: matches[1]._id,
      user: user._id,
      seats: firstMatchSeats.map((s) => s._id),
      totalAmount: firstMatchSeats.reduce((sum, s) => sum + s.ticketPrice, 0),
    });
    await Reservation.create({
      match: matches[2]._id,
      user: user._id,
      seats: firstMatchSeats.map((s) => s._id),
      totalAmount: firstMatchSeats.reduce((sum, s) => sum + s.ticketPrice, 0),
    });

    console.log("Reservation created");

    console.log("✅ Dummy data seeding complete!");
    mongoose.disconnect();
  } catch (err) {
    console.error("Error seeding data:", err);
    mongoose.disconnect();
  }
}

seed();
