const mongoose=require("mongoose")
const dotenv=require("dotenv")
dotenv.config()
mongoose.connect("mongodb://localhost/gymDb",console.log("connected to server"))

module.exports=mongoose.connection