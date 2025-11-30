// all the specific match seats
const mongoose = require("mongoose")
const reservationSchema = mongoose.Schema({
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    seats: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Seat',
    }],
    totalAmount: {
        type: Number,
        required: true,
    }
},{timestamps: true})
module.exports=mongoose.model('Reservation', reservationSchema);