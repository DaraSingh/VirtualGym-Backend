const mongoose=require("mongoose")

mongoose.connect("mongodb://localhost/gymDb",console.log("connected to server"))

module.exports=mongoose.connection