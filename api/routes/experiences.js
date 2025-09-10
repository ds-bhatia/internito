const express = require("express");
const router = express.Router();
const Experience = require("../models/Experience");
const nodemailer = require("nodemailer");
const User = require("../models/User");

// Include npm packages
const natural = require("natural");
const aposToLexForm = require("apos-to-lex-form");
const SpellCorrector = require("spelling-corrector");
const spellCorrector = new SpellCorrector();
spellCorrector.loadDictionary();
const stopword = require("stopword");


const getSentiment = text => {
  if (!text || typeof text !== 'string') {
    throw new Error('Invalid input: text must be a non-empty string');
  }
  // Check if the text is empty after removing spaces
  if (text.trim() === '') {
    return 0; // Neutral sentiment
  }

  // NLP Logic
  // Convert all data to its standard form and lowercase
  const lexData = aposToLexForm(text)
    .toLowerCase()
    .replace(/[^a-zA-Z\s]+/g, "");

  // Tokenization
  const tokenConstructor = new natural.WordTokenizer();
  const tokenizedData = tokenConstructor.tokenize(lexData);
  //console.log("Tokenized Data: ",tokenizedData);

  const fixedSpelling = tokenizedData.map((word) => spellCorrector.correct(word));

  // Remove Stopwords
  const filteredData = stopword.removeStopwords(fixedSpelling);
  //console.log("After removing stopwords: ",filteredData);

  // Stemming
  const Sentianalyzer =
  new natural.SentimentAnalyzer('English', natural.PorterStemmer, 'afinn');
  const analysis_score = Sentianalyzer.getSentiment(filteredData);
  //console.log("Sentiment Score: ",analysis_score);
  return analysis_score;
}



// Get all experiences sorted by date
router.get("/", async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ date: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to retrieve experiences" });
  }
});

router.get("/specific/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }
    res.status(200).json(experience);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to retrieve experience" });
  }
}
);

router.get("/user/:id",async (req,res) => {
  try {
    const { id } = req.params;
    const experiences = await Experience.find({user: id}).sort({ date: -1 });
    if (!experiences) {
      return res.status(404).json({ message: "Experience not found" });
    }
    res.status(200).json(experiences);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to retrieve experience" });
  }
})

router.get("/pending", async (req, res) => {
  try {
    const experiences = await Experience.find({ "status": "Pending" }).sort({ date: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to retrieve experiences" });
  }
});

// Add a new experience
router.post("/addExperience", async (req, res) => {
  try {
    // Ensure user is authenticated (Google Auth should set req.user)
    if (!req.user || !req.user.user || !req.user.user._id) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const {
      company, batch, cgpaCutoff, experienceType,
      eligibleBranches, OT_description, OT_duration, OT_questions, interviewRounds, other_comments,
      jobDescription, numberOfSelections, comments,
    } = req.body;

    // Validate required fields
    if (!company || !batch || !cgpaCutoff || !experienceType || !OT_questions || !interviewRounds) {
      return res.status(400).json({ error: true, message: 'All required fields must be filled.' });
    }

    // Sentiment check (unchanged)
    const text = [
      OT_description || "",
      ...(OT_questions || []),
      ...(interviewRounds?.map(r => r.description) || []),
      other_comments || ""
    ].join(" ");
    const sentimentScore = getSentiment(text);
    if (sentimentScore < -2) {
      return res.status(400).json({ error: true, message: 'Sentiment score is negative. Please check your input.' });
    }

    // Get user's name
    const userObj = req.user.user;
    const name = userObj.firstName && userObj.lastName
      ? `${userObj.firstName} ${userObj.lastName}`
      : userObj.firstName || userObj.lastName || "";

    // Create a new experience
    const newExperience = new Experience({
      user: userObj._id,
      name, // <-- add name here
      company,
      batch,
      cgpaCutoff,
      experienceType,
      eligibleBranches,
      OT_description, // <-- Add this line
      OT_duration,
      OT_questions,
      interviewRounds,
      other_comments,
      jobDescription,
      numberOfSelections,
      status: "Pending",
      comments,
    });
    const savedExperience = await newExperience.save();
    res.status(201).json({ success: true, message: 'Experience added successfully!' });
  } catch (error) {
    console.error('Error submitting experience:', error);
    res.status(500).json({ message: 'Failed to submit experience' });
  }
});



//a patch route to update the status of an experience
router.patch("/verify/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const experience = await Experience.findById(id);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }
    experience.status = status;
    const updatedExperience = await experience.save();
    res.status(200).json(updatedExperience);
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to update experience status" });
  }
});

router.delete("/delete/:experienceId", async (req, res) => {
  try {
    const { experienceId } = req.params;
    const experience = await Experience.findByIdAndDelete(experienceId);
    if (!experience) {
      return res.status(404).json({ message: "Experience not found" });
    }
    res.status(200).json({ message: "Experience deleted" });
  } catch (error) {
    console.log(error);
    res.status(400).json({ message: "Failed to delete experience" });
  }
});

router.put("/edit/:experienceId", async (req, res) => {
  try {
    const { experienceId } = req.params;
    const updated = await Experience.findByIdAndUpdate(
      experienceId,
      req.body,
      { new: true }
    );
    if (!updated) return res.status(404).json({ message: "Experience not found" });
    res.status(200).json(updated);
  } catch (error) {
    res.status(400).json({ message: "Failed to update experience" });
  }
});


// Search all experiences sorted by date
router.post('/search', async (req, res) => {
  try {
    const experiences = await Experience.find().sort({ date: -1 });
    res.status(200).json(experiences);
  } catch (error) {
    console.error('Error fetching search results:', error);
    res.status(500).json({ message: 'Failed to fetch search results' });
  }
});

// Search by company name (regex) and/or CGPA, grouped by company
router.post('/company', async (req, res) => {
  const { company, cgpa, branch } = req.body;

  // Allowed branches
  const BRANCHES = [
    "CSE",
    "ECE",
    "EEE",
    "MECH",
    "CHEM",
    "CIVIL",
    "MME",
    "BIOTECH",
  ];

  try {
    const query = {};

    // Company filter (case-insensitive regex)
    if (company) {
      query.company = { $regex: company, $options: "i" };
    }

    // CGPA filter (must be >0 and <10)
    if (cgpa) {
      const cgpaNum = parseFloat(cgpa);
      if (isNaN(cgpaNum) || cgpaNum <= 0 || cgpaNum >= 10) {
        return res.status(400).json({ message: "CGPA must be between 0 and 10." });
      }
      query.cgpaCutoff = { $lte: cgpaNum };
    }

    // Branch filter (must be in allowed list, case-insensitive)
    if (branch && BRANCHES.includes(branch.toUpperCase())) {
      query.eligibleBranches = { $in: [branch.toUpperCase()] };
    }

    const experiences = await Experience.find(query).sort({ date: -1 });

    // Group by company
    const groupedByCompany = experiences.reduce((acc, experience) => {
      if (!acc[experience.company]) {
        acc[experience.company] = [];
      }
      acc[experience.company].push(experience);
      return acc;
    }, {});

    res.status(200).json(groupedByCompany);
  } catch (error) {
    console.error('Error fetching company search results:', error);
    res.status(500).json({ message: 'Failed to fetch company search results' });
  }
});


router.get("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const experience = await Experience.findById(id)
    .populate("comments.user", "firstName lastName")
    .populate("comments.replies.user", "firstName lastName");
    if (!experience) return res.status(404).json({ message: "Experience not found" });

    res.status(200).json(experience.comments);
  } catch (error) {
    console.error("Error fetching comments:", error);
    res.status(500).json({ message: "Failed to fetch comments" });
  }
});

router.post("/:id/comments", async (req, res) => {
  try {
    const { id } = req.params;
    const { text } = req.body;

    if (!req.user || !req.user.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }
    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Comment text is required" });
    }

    const experience = await Experience.findById(id).populate("user");
    if (!experience) return res.status(404).json({ message: "Experience not found" });

    experience.comments.push({
      user: req.user.user._id,
      text,
    });
    await experience.save();
    await experience.populate("comments.user", "firstName lastName");

    const created = experience.comments[experience.comments.length - 1];

    const owner = experience.user;
    // console.log(owner);
    const commenter = req.user.user;

    if (owner.email) {
      const transporter = nodemailer.createTransport({
        service: "gmail",
        auth: {
          user: process.env.FEEDBACK_MAIL_USER,
          pass: process.env.FEEDBACK_MAIL_PASS,
        },
      });

      await transporter.sendMail({
        from: `"interNito Comment" <${process.env.FEEDBACK_MAIL_USER}>`,
        to: owner.email,
        subject: `New comment on your ${experience.company} experience`,
        replyTo: commenter.email,
        html: `
          <div style="font-family:'Poppins',Arial,sans-serif;max-width:600px;margin:0 auto;background:#f9f9f9;padding:32px 24px 24px 24px;border-radius:16px;box-shadow:0 2px 12px rgba(34,139,34,0.07);">
            <div style="text-align:center;margin-bottom:18px;">
              <img src="https://drive.usercontent.google.com/download?id=15i1bEJ-SXKmF4WwqDLo83Qot7rrzSRSA&export=view&authuser=0" alt="interNito Logo" style="width:70px;height:auto;margin-bottom:8px;display:inline-block;" />
            </div>
            <div style="text-align:center;margin-bottom:24px;">
              <h2 style="margin:0;font-size:1.5rem;color:#222;font-weight:600;letter-spacing:0.01em;">New Comment Received</h2>
            </div>
            <div style="background:#fff;border-radius:12px;padding:20px 18px 14px 18px;border:1.5px solid #e0e0e0;">
              <p style="margin:0 0 8px 0;font-size:1.05rem;color:#333;">
                <strong>From:</strong> <span style="color:#76b852;">${commenter.firstName} ${commenter.lastName || ""} (${commenter.email})</span>
              </p>
              <p style="margin:0 0 8px 0;font-size:1.05rem;color:#333;">
                <strong>Comment:</strong>
              </p>
              <div style="border-left:4px solid #76b852;padding-left:14px;margin:8px 0 16px 0;color:#222;font-size:1.08rem;line-height:1.6;background:#f6fff4;border-radius:6px;">
                ${text}
              </div>
              <p style="font-size:0.97rem;color:#888;margin:0 0 4px 0;">
                <em>Replying to this email will send your response directly to the commenter.</em>
              </p>
            </div>
            <div style="margin-top:28px;text-align:center;font-size:0.95rem;color:#aaa;">
              <span>interNito Notification System</span>
            </div>
          </div>
        `,
      });
    }

    return res.status(201).json({ comment: created });
  } catch (error) {
    console.error("Error adding comment:", error);
    res.status(500).json({ message: "Failed to add comment" });
  }
});

router.post("/:experienceId/comments/:commentId/replies", async (req, res) => {
  try {
    if (!req.user || !req.user.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    const { experienceId, commentId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === "") {
      return res.status(400).json({ message: "Reply text is required" });
    }

    const experience = await Experience.findById(experienceId).populate("comments.user", "firstName lastName");
    if (!experience) return res.status(404).json({ message: "Experience not found" });

    const comment = experience.comments.id(commentId);
    if (!comment) return res.status(404).json({ message: "Comment not found" });

    comment.replies.push({
      user: req.user.user._id,
      text,
    });

    await experience.save();
    await experience.populate("comments.replies.user", "firstName lastName");

    const newReply = comment.replies[comment.replies.length - 1];
    res.status(201).json({ reply: newReply });
  } catch (error) {
    console.error("Error adding reply:", error);
    res.status(500).json({ message: "Failed to add reply" });
  }
});

module.exports = router;