const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { ObjectId } = require("mongodb");
const { Student } = require("./loginRouter");

const assignmentSchema = new mongoose.Schema({
  title: String,
  courseID: String,
  deadline: { type: Date, default: Date.now },
  file: {
    fileName: String,
    content: Buffer,
    contentType: String,
  },
});

const submissionSchema = new mongoose.Schema({
  studentID: String,
  courseID: String,
  assignmentID: String,
  file: {
    fileName: String,
    content: Buffer,
    contentType: String,
  },
  text: String,
  supervisorComment: String,
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
// this is to get the submissions for the supervisors students for a certain assignment , supervisorID and courseID are sent in the body
router.post("/submissions/getSupervisorSubmissions", async (req, res) => {
  try {
    const assignmentID = req.body.assignmentID;
    const supervisorID = req.body.supervisorID;
    const students = await Student.find({ supervisorID });
    const studentIDsArray = students.map((s) => {
      return s.regID;
    });
    const peerIDsArray = students.map((s) => {
      return s.peerID;
    });
    // console.log(studentIDsArray);
    // console.log(peerIDsArray);
    const submissions = await Submission.find({
      studentID: { $in: studentIDsArray },
      assignmentID,
    });
    return res.json({ submissions, peerIDsArray });
  } catch (error) {
    console.error("Error during fetching submissions:", error);
    res.status(500).json({ message: "Error during fetching submissions" });
  }
});

// this api is used to add and edit the student submission

router.post(
  "/submissions/addSubmission",
  upload.single("file"),
  async (req, res) => {
    try {
      const assignmentID = req.body.assignmentID;
      const studentID = req.body.studentID;
      const courseID = req.body.courseID;
      const text = req.body.text;
      const newData = {
        studentID,
        assignmentID,
        courseID,
        file: {
          fileName: (req.file && req.file.originalname) || "",
          content: (req.file && req.file.buffer) || "",
          contentType: (req.file && req.file.mimetype) || "",
        },
        text,
      };

      const options = {
        upsert: true,
        new: true,
      };

      const submission = await Submission.findOneAndUpdate(
        { assignmentID, courseID, studentID },
        newData,
        options
      );
      return res.json(submission);
    } catch (error) {
      console.error("Error during fetching submissions:", error);
      res.status(500).json({ message: "Error during fetching submissions" });
    }
  }
);

router.post("/submissions/getSubmissionDetails", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const courseID = req.body.courseID;
    const assignmentID = req.body.assignmentID;

    const result = await Submission.findOne({
      studentID,
      courseID,
      assignmentID,
    });

    if (!result || result.length === 0) {
      res.json({});
    } else {
      res.contentType(result.file.contentType);
      res.json({
        id: result._id,
        text: result.text,
        file: {
          fileName: result.file.fileName || "",
          content: result.file.content.toString("base64") || "",
          contentType: result.file.contentType || "",
        },
        supervisorComment: result.supervisorComment,
      });
    }
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

router.put("/submissions/addComment", async (req, res) => {
  try {
    const submissionID = req.body.submissionID;
    const comment = req.body.comment;
    await Submission.updateOne(
      { _id: new ObjectId(submissionID) },
      { $set: { supervisorComment: comment } }
    );

    res.json("");
  } catch (error) {
    console.error("Error during adding a comment to the submission:", error);
    res
      .status(500)
      .json({ message: "Error during adding a comment to the submission" });
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
