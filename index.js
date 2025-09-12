const express=require('express');
const cors=require('cors')
const db=require("./config/mongoose-connection")
const app=express();
const userModel=require("./models/userModel")
app.use(cors())
app.use(express.json())

app.post("/register",async(req,res)=>{
    const {name,email,password}=req.body;
    const createdUser=await userModel.create({
        name,
        email,
        password
    })
    res.json(createdUser)
})

app.get("/listUsers",async(req,res)=>{
    const users=await userModel.find({})
    res.send(users)
})

app.get("/deleteUsers",async(req,res)=>{
    const users=await userModel.deleteMany({})
    res.send(users)
})



app.listen(3000,
    console.log("listening at port 3000")
)