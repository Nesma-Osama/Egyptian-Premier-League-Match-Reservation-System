const mongoose = require("mongoose")
const userSchema = mongoose.Schema({
    username: {
        type: String,
        unique: true,
        required: true,
        trim:true
    },
    password: {
        type: String,
        required: true,
        trim:true
    },
    firstName: {
        type:String,
        required: true,
        trim:true
    },
    lastName: {
        type:String,
        required: true,
        trim:true
    },
    birthDate: {
        type:Date,
        required: true,
    },
    gender: {
        type: String,
        required: true,
        enum:['M','F']
    },
    city: {
        type: String,
        required:true
    },
    address: {
        type: String,
        default:''        
    },
    email: {
        type: String,
        required:true
    },
    role: {
        type: String,
        enum: ['Fan', 'Manager', 'Admin'],
        default:'Fan'
    },
    isAuthorized: {
        type: Boolean,
        default:false
    }
})
module.exports = mongoose.model('User', userSchema);
