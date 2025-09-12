const mongoose=require("mongoose")

const userSchema=mongoose.Schema({
    name:String,
    email:String,
    password:String,
    personelInfo:{
        age:Number,
        weight:Number,
        height:Number,
    },
    currentPlan:{
        type:[
            {
               image:String,
               description:String,
               duration:Number,
               sets:Number, 
            }
        ],
        default:[]

    },
    otherInfo:String
})

module.exports=mongoose.model("user",userSchema)