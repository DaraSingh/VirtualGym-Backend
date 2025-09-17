const mongoose = require("mongoose");

const userSchema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
  age: {
    type: Number,
    default: 0,
  },
  weight: {
    type: Number,
    default: 0,
  },
  height: {
    type: Number,
    default: 0,
  },
  exercisePlan: { type: mongoose.Schema.Types.ObjectId, ref: "UserExercisePlan"},
  otherInfo: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("user", userSchema);
