const mongoose = require("mongoose");
const experienceSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  company: { type: String, required: true },
  batch: { type: String, required: true },
  cgpaCutoff: { type: Number, required: true },
  experienceType: { type: String, required: true },
  eligibleBranches: [{ type: String }],
  OT_description: { type: String }, // <-- add this
  OT_duration: {type: String},
  OT_questions: [{ type: String }],
  interviewRounds: [
    {
      title: String,
      description: String,
      duration: String
    }
  ],
  other_comments: { type: String },
  jobDescription: { type: String }, // <-- add this
  numberOfSelections: { type: Number }, // <-- add this
  name: { type: String, required: true }, // <-- add this
  status: { type: String, required: true },
  comments: [
    {
      user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
      text: { type: String, required: true },
      createdAt: { type: Date, default: Date.now },
      replies: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
          text: { type: String, required: true },
          createdAt: { type: Date, default: Date.now },
        }
      ],
    }
  ]
}, { timestamps: true });

module.exports = mongoose.model("Experience", experienceSchema);