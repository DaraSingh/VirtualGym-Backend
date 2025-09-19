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
const UserExercisePlan=require("./models/userPlanModel")
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);
app.use(express.json());

app.post('/DoneToday',async(req,res)=>{
    const token=req.cookies.token;
    const email=jwt.decode(token);
    const user=await userModel.findOne({email:email});
    user.curDay++;
    if(user.curDay>=10) user.curDay=0
    user.save();
    res.status(200).json({message:"Congratulation You Did It."})
})


app.post("/workout",async(req,res)=>{
    const token=req.cookies.token;
    const email=jwt.decode(token);
    const user=await userModel.findOne({email:email}).populate("exercisePlan");
    if(user){
        // console.log(user.exercisePlan.plan[user.curDay])
        res.json({day:user.curDay,plan:user.exercisePlan.plan[user.curDay]})
    }
})


app.post("/generate", async (req, res) => {
  // console.log(req.body)
  const token = req.cookies.token;
  const email = jwt.decode(token);
  console.log(email)
  const updatedUser = await userModel.findOneAndUpdate(
    { email: email },
    { $set: req.body }, // update only the fields provided
    { new: true } // return the updated document
  ).populate("exercisePlan");
  updatedUser.curDay=0;
  updatedUser.save();
  console.log(updatedUser);
  const prompt = `
Generate a 10-day workout plan for an individual in JSON Format having details as:
- Age: ${updatedUser.age} years
- Weight: ${updatedUser.weight} kg
- Height: ${updatedUser.height} ft
- Additional Info: ${updatedUser.otherInfo}

Constraints:
- All exercises must be doable at home or in a park.
- Allowed equipment: body weight, yoga mat, resistance band, pull-up bar, or dumbbells.
- Avoid gym-only machines or expensive equipment.
- Include strength, cardio, mobility, and core work.

Requirements:
1. Each workout day must contain at least 10 exercises.
2. There must be at least 10 unique workout plans across the 30 days.
3. Exercises should cover different muscle groups across the unique plans.
4. Detailed and clear Exercise steps.
Output Format (strict JSON only) avoid trailing commas where not needed:
5. reps,sets,durations should be integer only (no text)
[
  {
    "day": <day number>,
    "exercises": [
      {
        "name": "Exercise Name",
        "sets": <integer count>,
        "reps": <integer count>,
        "duration": <integer seconds>,
        "rest(between exercises)": <integer seconds>,
        "focusArea": "Target muscles or body parts",
        "equipment": "Required equipment or 'body weight'",
        "steps": [
          "Step 1 instruction",
          "Step 2 instruction",
          "Step 3 instruction"
        ]
      }
    ]
  }
]

Rules:
-if reps has some text like as many as possible or any other make reps as string
- "duration" and "rest" must be numbers in seconds only.
- "sets" and "reps" must be integers
- If exercise is duration-based, set "reps": 0 and put seconds in "duration".
- If exercise is rep-based, set "duration": 0.
- Ensure exactly 10 days are generated.
-Ensure reps and sets are integer only
- Ensure the JSON is valid and contains no explanation or text outside the JSON.
`;

  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  let result = await model.generateContent(prompt);
  let text = await result.response.text();
  function extractJSON(str) {
    return str.replace(/```json|```/g, '').trim();
}
    text = extractJSON(text);
    console.log(text)
    // console.log(result)
    let plan;
  try {
    plan=JSON.parse(text);
  } catch {
    console.warn("Invalid JSON, retrying with repair...");

    const repairPrompt = `
    Fix the following invalid JSON and return ONLY valid JSON:
    ${text}
    `;

    result = await model.generateContent(repairPrompt);
    text = extractJSON(await(result.response.text()));
    plan=JSON.parse(text); // if still invalid, throw
  }
  if (updatedUser.exercisePlan) {
    // User has an existing plan → update it
    updatedUser.exercisePlan.plan = plan;
    await updatedUser.exercisePlan.save();
    // console.log("Plan updated successfully");
    res.status(200).json({message:"Plan Updated successfully"})
  } else {
    // User has no plan → create a new one
    const planDoc = await UserExercisePlan.create({
      userId: updatedUser._id,
      plan: plan
    });
    updatedUser.exercisePlan=planDoc._id;
    planDoc.userId=updatedUser._id;
    await planDoc.save();
    await updatedUser.save();
    res.status(200).json({message:"Plan Created successfully"})
}
});

app.post("/generatePlan", async (req, res) => {
  const token = req.cookies.token;
  const email = jwt.decode(token);
  // console.log(token);
  const user = await userModel.findOne({ email: email });
  // console.log(user);
  if (user) res.status(200).json(user);
  else res.status(201).json({ message: "Record Not Found" });
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
    const token = jwt.sign(user.email,process.env.SECRET_KEY);
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
  const users = await userModel.find().populate("exercisePlan");
  res.send(users);
});

app.get("/deleteUsers", async (req, res) => {
  const users = await userModel.deleteMany({});
  res.send(users);
});

app.listen(3000, console.log("listening at port 3000"));
