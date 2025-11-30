const mongoose = require("mongoose")
const matchSchema = mongoose.Schema({
    homeTeam: {
        type: Number,
        required: true,
        min: 1,
        max:18
    },
    awayTeam: {
        type: Number,
        required: true,
        min: 1,
        max: 18,
        validate: {
            validator: function (v) {
                return v!=this.homeTeam
            },
             message:"Home team and away team must be different"
        }
    },
    stadium: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Stadium',
    required: true
    },
    matchDate: {
        type: Date,
        required:true
    },
    referee: {
        type: String,
        trim: true,
        required:true
    },
    linesmen:{
        type: [String],
        required: true,
        validate: {
            validator: function (v) {
                return v.length==2&& v[0]!==v[1]&& v[0]!==this.referee&&v[1]!==this.referee
            },
            message:"Must have exactly 2 unique linesmen different from main referee"
        }
    }
    ,
    state: {
        type: String,
        enum: ["Scheduled", "Completed"],
        default:"Scheduled"
    }
    
},{timestamps: true})
module.exports = mongoose.model('Match', matchSchema);
