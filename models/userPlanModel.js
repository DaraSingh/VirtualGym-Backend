const mongoose=require("mongoose")

const exerciseSchema = mongoose.Schema({
  name: { type: String, required: true },
  sets: { type: mongoose.Schema.Types.Mixed}, // can be Number or String
  reps:{type: mongoose.Schema.Types.Mixed}, // can be Number or String
  duration: { type: Number, default: 0 }, // in seconds
  rest: { type: Number, default: 30 }, // optional rest between sets
  steps: { type: [String], default: [] }, // instructions
  equipment: { type: String, default: "body weight" },
  focusArea: { type: String },
});

const userPlanSchema = mongoose.Schema({
  userID: { type: mongoose.Schema.Types.ObjectId, ref: "user"},
  plan: [
    {
      day: { type: String, required: true }, // e.g., "Monday"
      exercises: [exerciseSchema],
    }
  ],
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model("UserExercisePlan", userPlanSchema);