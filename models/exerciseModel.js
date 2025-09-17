const mongoose=require("mongoose")

const exerciseShema=mongoose.Schema({
    name:String,
    image:String
})

module.exports=mongoose.model("exercise",exerciseShema)