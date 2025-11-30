const mongoose = require("mongoose")
const stadiumSchema = mongoose.Schema({
    name: {
        type: String,
        trim: true,
        unique: true,
        required: true,
    },
    vipRows: {
        type: Number,
        required: true,
        min:1
    },
    seatsPerRow: {
        type: Number,
        required: true,
        min:1
    }
},{timestamps: true})
module.exports=mongoose.model('Stadium', stadiumSchema);