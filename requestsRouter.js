const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const requestSchema = new mongoose.Schema({
  senderID: String,
  recieverID: String,
  courseID: String,
  status: String,
  type: String,
});

const Request = mongoose.model("Request", requestSchema);

router.post("/requests", async (req, res) => {
  try {
    const requestItem = new Request({
      senderID: req.body.senderID,
      recieverID: req.body.recieverID,
      courseID: req.body.courseID,
      status: req.body.status,
      type: req.body.type,
    });
    const request = await requestItem.save();

    if (!request) {
      res.status(404).json("Failed to send the request");
    } else {
      res.json(request);
    }
  } catch (error) {
    console.error("Error during sending request:", error);
    res.status(500).json("Failed to send the request");
  }
});

router.get("/requests/student/:studentID/:courseID", async (req, res) => {
  try {
    const studentID = req.params.studentID;
    const courseID = req.params.courseID;
    const request = await Request.find({ senderID: studentID, courseID });

    if (!request) {
      res.status(404).json("No Requests");
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
        return res.status(404).json({ error: "Request not found" });
      }
      res.json(request);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Unable to delete the request" });
    }
  }
);

module.exports = router;
