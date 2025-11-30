// all the specific match seats
const mongoose = require("mongoose")
const seatSchema = mongoose.Schema({
    match: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Match',
        required: true,
    },
    vipRow: {
        type: Number,
        required: true,
        min:1
    },
    seatNumber: {
        type: Number,
        required: true,
        min:1
    },
    state: {
        type: String,
        enum: ["vacant", "reserved"],
        default:"vacant"
    },
    ticketPrice: {
        type: Number,
        required: true,
    }
},{timestamps: true})
module.exports=mongoose.model('Seat', seatSchema);