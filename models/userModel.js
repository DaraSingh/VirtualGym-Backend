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
  currentPlan: {
    type: [
      {
        image: String,
        description: String,
        duration: Number,
        sets: Number,
        done: {
          type: Boolean,
          default: false,
        },
        review: {
          type: String,
          default: "",
        },
      },
    ],
    default: [],
  },
  otherInfo: {
    type: String,
    default: "",
  },
});

module.exports = mongoose.model("user", userSchema);
