const mongoose = require("mongoose")
const bcrypt = require("bcryptjs")

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
        required:true,
        unique: true,
        trim: true
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
},{timestamps: true})

// Hash password before saving
userSchema.pre('save', async function() {
    if (!this.isModified('password')) {
        return;
    }
    
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Method to compare passwords
userSchema.methods.comparePassword = async function(candidatePassword) {
    return await bcrypt.compare(candidatePassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
