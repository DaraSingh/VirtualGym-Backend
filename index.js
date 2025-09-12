const express = require("express");
const cors = require("cors");
const db = require("./config/mongoose-connection");
const app = express();
const userModel = require("./models/userModel");
const bcrypt = require("bcrypt");

app.use(cors());
app.use(express.json());



app.post("/register", async (req, res) => {
  try {
    const { name, email, password } = req.body;
    const duplicate = await userModel.findOne({ email: email });
    if (duplicate)
      return res.status(400).json({ message: "Email already exists" });
    bcrypt.genSalt(10, (err, salt) => {
      bcrypt.hash(password, salt, async (err, hash) => {
        const createdUser = await userModel.create({
          name,
          email,
          password: hash,
        });
        res.json({ message: "User Created Successfully" });
      });
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.get("/listUsers", async (req, res) => {
  const users = await userModel.find({});
  res.send(users);
});

app.get("/deleteUsers", async (req, res) => {
  const users = await userModel.deleteMany({});
  res.send(users);
});

app.listen(3000, console.log("listening at port 3000"));
