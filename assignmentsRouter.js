const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { ObjectId } = require("mongodb");

const assignmentSchema = new mongoose.Schema({
  title: String,
  courseID: String,
  deadline: { type: Date, default: Date.now },
  file: {
    fileName: String,
    content: Buffer,
  },
});

const submissionSchema = new mongoose.Schema({
  studentID: String,
  courseID: String,
  assignmentID: String,
  file: {
    fileName: String,
    content: Buffer,
  },
  text: String,
});

const Assignment = mongoose.model("Assignment", assignmentSchema);
const Submission = mongoose.model("Submission", submissionSchema);

router.post("/assignments", async (req, res) => {
  try {
    const courseID = req.body.courseID;
    const assignments = await Assignment.find({ courseID });
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
    return res.json(assignment);
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

router.post(
  "/submissions/addSubmission",
  upload.single("file"),
  async (req, res) => {
    try {
      const assignmentID = req.body.assignmentID;
      const studentID = req.body.studentID;
      const courseID = req.body.courseID;
      const text = req.body.text;
      console.log(req.file);
      console.log(req.body);
      const newData = {
        studentID,
        assignmentID,
        courseID,
        // file: {
        //   fileName:
        //     (req.file && req.file.originalname) || req.body.file.fileName,
        //   content:
        //     (req.file && req.file.buffer) ||
        //     Buffer.from(req.body.file.content, "base64"),
        // },
        file: {
          fileName: (req.file && req.file.originalname) || "",
          content: (req.file && req.file.buffer) || "",
        },
        text,
      };

      //   atob(req.body.file.content)
      console.log(newData.file);
      const options = {
        // Set the upsert option to true
        upsert: true,
        // Return the updated document after the update or insert operation
        new: true,
      };

      const submission = await Submission.findOneAndUpdate(
        { assignmentID, courseID, studentID },
        newData,
        options
      );
      return res.json(submission);
    } catch (error) {
      console.error("Error during fetching previous projects:", error);
      res
        .status(500)
        .json({ message: "Error during fetching previous projects" });
    }
  }
);

router.post("/submissions/getSubmission", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const courseID = req.body.courseID;
    const assignmentID = req.body.assignmentID;

    const result = await Submission.findOne({
      studentID,
      courseID,
      assignmentID,
    });
    // console.log(result);

    if (!result || result.length === 0) {
      res.json({
        // id: 0,
        // text: "",
        // file: {
        //   fileName: "",
        //   content: "",
        // },
      });
    } else {
      res.json({
        id: result._id,
        text: result.text,
        file: {
          fileName: result.file.fileName || "",
          content: result.file.content.toString("base64") || "",
        },
      });
    }
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

router.delete("/submissions/:submissionID", async (req, res) => {
  try {
    let submissionID = req.params.submissionID;
    let objectID = mongoose.Types.ObjectId;
    let newID = new objectID(submissionID);

    const submission = await Submission.findByIdAndDelete(newID);
    if (!submission) {
      return res.json([]);
    }
    res.json("Submission deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Unable to delete the item");
  }
});

module.exports = router;
