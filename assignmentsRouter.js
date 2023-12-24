const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { ObjectId } = require("mongodb");

const assignmentSchema = new mongoose.Schema({
  _id: Object,
  title: String,
  courseID: String,
  deadline: { type: Date, default: Date.now },
  file: {
    fileName: String,
    content: Buffer,
  },
});

const Assignment = mongoose.model("Assignment", assignmentSchema);

router.post("/assignments", async (req, res) => {
  try {
    const courseID = req.body.courseID;
    console.log(courseID);
    const assignments = await Assignment.find({ courseID });
    console.log(assignments);
    return res.json(assignments);
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

router.get("/assignments/:assignmentID", async (req, res) => {
  try {
    const assignmentID = req.params.assignmentID;
    const assignment = await Assignment.findOne({
      _id: new ObjectId(assignmentID),
    });
    console.log(assignment);
    return res.json(assignment);
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

module.exports = router;
