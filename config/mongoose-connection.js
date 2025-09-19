const mongoose=require("mongoose")
const dotenv=require("dotenv")
dotenv.config()
const URI=process.env.MONGODB_URI;

mongoose.connect(URI,console.log("connected to server"))
module.exports=mongoose.connection