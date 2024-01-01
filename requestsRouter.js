const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  senderID: String,
  receiverID: String,
  courseID: String,
  status: String,
  type: String,
});

const Request = mongoose.model("Request", requestSchema);

router.post("/request/supervisor", async (req, res) => {
  try {
    const requestItem = new Request({
      senderID: req.body.senderID,
      receiverID: req.body.receiverID,
      courseID: req.body.courseID,
      status: "pending",
      type: "supervisor",
    });
    const request = await requestItem.save();

    if (!request) {
      res.status(404).json("Failed to send the request");
    } else {
      res.json("Successfully sent");
    }
  } catch (error) {
    console.error("Error during sending request:", error);
    res.status(500).json("Failed to send the request");
  }
});

router.post("/requests/student", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const courseID = req.body.courseID;
    const request = await Request.find({ senderID: studentID, courseID });

    console.log(studentID, courseID);
    console.log(request);

    if (!request) {
      res.json([]);
    } else {
      res.json(request);
    }
  } catch (error) {
    console.error("Error during fetching requests:", error);
    res.status(500).json({ message: "Error during fetching requests" });
  }
});

router.put(
  "/requests/registerCourse/:studentID/:courseID",
  async (req, res) => {
    try {
      let studentID = req.params.studentID;
      let courseID = req.params.courseID;
      const requestItem = await Request.findOne({
        senderID: studentID,
        courseID,
      });
      const request = await Request.findByIdAndUpdate(
        requestItem._id,
        { type: "course", status: "pending" },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(request);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update the request" });
    }
  }
);

router.put(
  "/requests/removeCourseRegisteration/:studentID/:courseID",
  async (req, res) => {
    try {
      let studentID = req.params.studentID;
      let courseID = req.params.courseID;
      const requestItem = await Request.findOne({
        senderID: studentID,
        courseID,
      });
      const request = await Request.findByIdAndUpdate(
        requestItem._id,
        { type: "supervisor", status: "accepted" },
        {
          new: true,
          runValidators: true,
        }
      );
      console.log(request);
      if (!request) {
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to update the request" });
    }
  }
);

router.delete(
  "/requests/supervisorRequest/:studentID/:courseID",
  async (req, res) => {
    try {
      let studentID = req.params.studentID;
      let courseID = req.params.courseID;
      const requestItem = await Request.findOne({
        senderID: studentID,
        courseID,
      });
      const request = await Request.findByIdAndDelete(requestItem._id);
      console.log(request);
      if (!request) {
        return res.status(404).json("Request not found");
      }
      res.json("deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(500).json("Unable to delete the request" );
    }
  }
);

module.exports = router;
