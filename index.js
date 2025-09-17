const express = require("express");
const cors = require("cors");
const db = require("./config/mongoose-connection");
const app = express();
const userModel = require("./models/userModel");
const bcrypt = require("bcrypt");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const fetch = require("node-fetch"); //=>for rapid api
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.post("/generate", async (req, res) => {
  // console.log(req.body)
  const token = req.cookies.token;
  const email = jwt.verify(token, "secretKey");
  const updatedUser = await userModel.findOneAndUpdate(
    { email: email },
    { $set: req.body }, // update only the fields provided
    { new: true } // return the updated document
  );

  console.log(updatedUser);
  const prompt = `
    Generate a 30-day exercise plan for an individual:
    - Age: ${updatedUser.age} years
    - Weight: ${updatedUser.weight} kg
    - Height: ${updatedUser.height} ft
    - Additional Info: ${updatedUser.otherInfo}

    Return the response strictly in JSON with the structure:
    [
      { "day": 1, "exercises": ["exercise1", "exercise2", ...] },
      { "day": 2, "exercises": [...] }
    ]
    `;
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);
    const text = result.response.text();
    console.log(text)
});

app.post("/generatePlan", async (req, res) => {
  const token = req.cookies.token;
  const email = jwt.verify(token,"secretKey");
  // console.log(token);
  const user = await userModel.findOne({ email: email });
  // console.log(user);
  if (user) res.status(200).json(user);
  else res.status(400).json({ message: "Record Not Found" });
});

app.post("/check_auth", (req, res) => {
  try {
    const token = req.cookies.token;
    // console.log(token)
    if (token) res.status(200).json({ isLoggedIn: true });
    else res.status(200).json({ isLoggedIn: false });
  } catch (error) {
    res.status(401).json({ message: error });
    console.log({ message: error });
  }
});

app.get("/logout", (req, res) => {
  res.clearCookie("token");
  res.status(200).json({ message: "Logged Out Successfully" });
});

app.post("/login", async (req, res) => {
  try {
    const user = await userModel.findOne({ email: req.body.email });
    if (!user) return res.status(401).json({ message: "Incorrect credential" });
    const result = await bcrypt.compare(req.body.password, user.password);
    if (result == false)
      return res.status(401).json({ message: "Incorrect credential" });
    const token = jwt.sign(user.email, "secretKey");
    res.cookie("token", token);
    res.status(200).json({ message: "Logged in Successfully" });
  } catch (err) {
    res.status(400).json({ message: err });
  }
});

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
