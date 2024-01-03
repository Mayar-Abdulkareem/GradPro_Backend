const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student, Professor } = require("./loginRouter");

const requestSchema = new mongoose.Schema({
  senderID: String,
  receiverID: String,
  courseID: String,
  status: String,
  type: String,
  senderName: String,
  receiverName: String
});

const Request = mongoose.model("Request", requestSchema);

router.post("/request/supervisor", async (req, res) => {
  try {
    const sender = await Student.findOne({ regID: req.body.senderID });
    const receiver = await Professor.findOne({ regID: req.body.receiverID }); 

    if (!sender || !receiver) {
      res.status(404).json("Sender or Receiver not found");
      return;
    }

    const requestItem = new Request({
      senderID: req.body.senderID,
      receiverID: req.body.receiverID,
      courseID: req.body.courseID,
      status: "pending",
      type: "supervisor",
      senderName: sender.name, 
      receiverName: receiver.name 
    });

    const request = await requestItem.save();

    if (!request) {
      res.status(404).json("Failed to send the request");
    } else {
      res.json("Request successfully sent");
    }
  } catch (error) {
    console.error("Error during sending request:", error);
    res.status(500).json("Failed to send the request");
  }
});

router.post("/requests/student", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const request = await Request.find({ senderID: studentID });

    if (!request || request.length === 0) {
      const emptyRequest = {
        senderID: "",
        receiverID: "",
        courseID: "",
        status: "",
        type: "",
        senderName: "",
        receiverName: ""
      };
      res.json(emptyRequest);
    } else {
      res.json(request);
    }
  } catch (error) {
    console.error("Error during fetching requests:", error);
    res.status(500).json({ message: "Error during fetching requests" });
  }
});


// router.put(
//   "/requests/registerCourse/:studentID/:courseID",
//   async (req, res) => {
//     try {
//       let studentID = req.body.studentID;
//       let courseID = req.body.courseID;
//       let skillsVector = req.body.skillsVector;

//       const requestItem = await Request.findOne({
//         senderID: studentID,
//         courseID,
//       });
//       const request = await Request.findByIdAndUpdate(
//         requestItem._id,
//         { type: "course", status: "pending" },
//         {
//           new: true,
//           runValidators: true,
//         }
//       );
//       console.log(request);
//       if (!request) {
//         return res.status(404).json("Request not found");
//       }
//       res.json("Successfully registered");
//     } catch (error) {
//       console.error(error);
//       res.status(500).json({ error: "Unable to update the request" });
//     }
//   }
// );

router.put("/requests/registerCourse", async (req, res) => {
  try {
    const { regID, courseID, skillsVector } = req.body;

    const requestItem = await Request.findOne({
      senderID: regID,
      courseID: courseID, 
    });

    if (!requestItem) {
      return res.status(404).json("No request found for the given regID and courseID.");
    }

    const request = await Request.findByIdAndUpdate(
      requestItem._id,
      { type: "course", status: "pending" },
      {
        new: true,
        runValidators: true,
      }
    );

    const updatedStudent = await Student.findOneAndUpdate(
      { regID: regID }, 
      { $set: { skillsVector: skillsVector } },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json("Student not found or skills vector update failed.");
    }

    res.json("Successfully registered for the course and updated skills vector.");
  } catch (error) {
    console.error("Error at /requests/registerCourse endpoint:", error);
    res.status(500).json({ error: "Unable to update the request or skills vector", details: error.message });
  }
});



router.delete(
  "/requests/supervisorRequest/:studentID",
  async (req, res) => {
    try {
      let studentID = req.params.studentID;
      const requestItem = await Request.findOne({
        senderID: studentID
      });
      const request = await Request.findByIdAndDelete(requestItem._id);
      console.log(request);
      if (!request) {
        return res.status(404).json("Request not found");
      }
      res.json("deleted successfully");
    } catch (error) {
      console.error(error);
      res.status(500).json("Unable to delete the request");
    }
  }
);

module.exports = router;
