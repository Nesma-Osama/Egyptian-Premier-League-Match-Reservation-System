const mongoose=require("mongoose")
const dotenv = require("dotenv")
const createAdmin=require("./createAdmin")
dotenv.config()
const connectDB = async () => {
    try {
        const connect = await mongoose.connect(process.env.DATABASE_URL)
        console.log("Database connected correctly")
        await createAdmin()
    }
    catch (error) {
        console.log("DataBase connection error",error)
    }
}
module.exports=connectDB