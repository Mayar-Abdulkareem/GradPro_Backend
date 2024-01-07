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
  receiverName: String,
});

const Request = mongoose.model("Request", requestSchema);

router.post("/requests/student", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const request = await Request.findOne({ senderID: studentID });

    if (!request || request.length === 0) {
      const emptyRequest = {
        senderID: "",
        receiverID: "",
        courseID: "",
        status: "",
        type: "",
        senderName: "",
        receiverName: "",
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

router.put("/requests/registerCourse", async (req, res) => {
  try {
    const { regID, skillsVector } = req.body;

    const requestItem = await Request.findOne({
      senderID: regID,
    });

    if (!requestItem) {
      return res
        .status(404)
        .json("No request found for the given regID and courseID.");
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
      return res
        .status(404)
        .json("Student not found or skills vector update failed.");
    }

    res.json(
      "Successfully registered for the course and updated skills vector."
    );
  } catch (error) {
    console.error("Error at /requests/registerCourse endpoint:", error);
    res.status(500).json({
      error: "Unable to update the request or skills vector",
      details: error.message,
    });
  }
});

// Peer Requests
router.put("/requests/sendPeerRequest", async (req, res) => {
  try {
    const { senderID, receiverID } = req.body;

    const requestItem = await Request.findOne({
      senderID,
    });

    const receiver = await Student.findOne({ regID: req.body.receiverID });

    if (!receiver) {
      res
        .status(404)
        .json("There is no student with this registeration number");
      return;
    }

    if (receiverID === senderID) {
      res.status(404).json("You can't send a request to your self");
      return;
    }

    if (receiver.peerID && receiver.peerID !== "") {
      res.status(404).json("Sorry, this student has a peer");
      return;
    }

    if (
      !receiver.courses.some(
        (obj) =>
          obj.courseID === requestItem.courseID &&
          obj.status.toLowerCase() === "registered"
      )
    ) {
      res.status(404).json("This student didn't register this course");
      return;
    }

    if (!requestItem) {
      return res.status(404).json("No request found for the given regID.");
    }

    await Request.findByIdAndUpdate(
      requestItem._id,
      {
        type: "peer",
        status: "pending",
        receiverID,
        receiverName: receiver.name,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json("Successfully sent the peer request.");
  } catch (error) {
    console.error("Error at /requests/peerRequest endpoint:", error);
    res.status(500).json({
      error: "Unable to update the request or skills vector",
      details: error.message,
    });
  }
});

router.put("/requests/cancelPeerRequest", async (req, res) => {
  try {
    const { senderID } = req.body;

    const requestItem = await Request.findOne({
      senderID,
    });

    if (!requestItem) {
      return res.status(404).json("No request found for the given regID.");
    }

    const student = await Student.findOne({ regID: senderID });

    const supervisor = await Professor.findOne({ regID: student.supervisorID });

    await Request.findByIdAndUpdate(
      requestItem._id,
      {
        type: "course",
        status: "accepted",
        receiverID: student.supervisorID,
        receiverName: supervisor.name,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json("Successfully canceled the peer request.");
  } catch (error) {
    console.error("Error at /requests/cancelPeerRequest endpoint:", error);
    res.status(500).json({
      error: "Unable to update the request or skills vector",
      details: error.message,
    });
  }
});

router.put("/requests/getPeerRequests", async (req, res) => {
  try {
    const { receiverID } = req.body;

    const requests = await Request.find({
      receiverID,
      type: "peer",
      status: "pending",
    });

    if (!requests) {
      return res.status(404).json("No request found for the given regID.");
    }

    res.json(requests);
  } catch (error) {
    console.error("Error at /requests/cancelPeerRequest endpoint:", error);
    res.status(500).json({
      error: "Unable to update the request or skills vector",
      details: error.message,
    });
  }
});

router.put("/requests/acceptPeerRequest", async (req, res) => {
  try {
    const { senderID, receiverID } = req.body;

    const senderRequest = await Request.findOne({
      senderID,
    });

    const receiver = await Student.findOne({ regID: receiverID });
    const sender = await Student.findOne({ regID: senderID });

    if (!senderRequest) {
      return res.status(404).json("No request found for the given regID.");
    }

    const result = await Request.findByIdAndUpdate(
      senderRequest._id,
      {
        type: "peer",
        status: "accepted",
        receiverID,
        receiverName: receiver.name,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const receiverOutgoingRequest = await Request.findOne({
      senderID: receiverID,
    });

    await Request.findByIdAndUpdate(
      receiverOutgoingRequest._id,
      {
        type: "peer",
        status: "accepted",
        receiverID: sender.regID,
        receiverName: sender.name,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const receiverIncomingRequests = await Request.find({
      receiverID,
      senderID: { $ne: senderID },
    });

    await Promise.all(
      receiverIncomingRequests.map(async (request) => {
        const student = await Student.findOne({ regID: request.senderID });
        const supervisor = await Professor.findOne({
          regID: student.supervisorID,
        });

        await Request.findByIdAndUpdate(
          request._id,
          {
            type: "course",
            status: "accepted",
            receiverID: supervisor.regID,
            receiverName: supervisor.name,
          },
          {
            new: true,
            runValidators: true,
          }
        );
      })
    );

    const senderIncomingRequests = await Request.find({
      receiverID: senderID,
      senderID: { $ne: receiverID },
    });

    await Promise.all(
      senderIncomingRequests.map(async (request) => {
        const student = await Student.findOne({ regID: request.senderID });
        const supervisor = await Professor.findOne({
          regID: student.supervisorID,
        });

        await Request.findByIdAndUpdate(
          request._id,
          {
            type: "course",
            status: "accepted",
            receiverID: supervisor.regID,
            receiverName: supervisor.name,
          },
          {
            new: true,
            runValidators: true,
          }
        );
      })
    );

    await Student.findByIdAndUpdate(
      sender._id,
      {
        peerID: receiver.regID,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await Student.findByIdAndUpdate(
      receiver._id,
      {
        peerID: sender.regID,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    res.json("Successfully accepted the peer request.");
  } catch (error) {
    console.error("Error at /requests/acceptPeerRequest endpoint:", error);
    res.status(500).json({
      error: "Unable to accept the peer request",
      details: error.message,
    });
  }
});

// Supervisor Requests
// send supervisor request
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
      receiverName: receiver.name,
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

// cancel supervisor request
router.delete("/requests/supervisorRequest/:studentID", async (req, res) => {
  try {
    let studentID = req.params.studentID;
    const requestItem = await Request.findOne({
      senderID: studentID,
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
});

router.put("/requests/getSupervisorRequests", async (req, res) => {
  try {
    const { receiverID, courseID } = req.body;

    const requests = await Request.find({
      receiverID,
      type: "supervisor",
      status: "pending",
      courseID,
    });

    if (!requests) {
      return res.status(404).json("No request found for the given regID.");
    }
    const resultArr = [];
    await Promise.all(
      requests.map(async (request) => {
        const student = await Student.findOne({ regID: request.senderID });
        resultArr.push({
          ...request._doc,
          GPA: student.GPA,
        });
      })
    );
    res.json(resultArr);
  } catch (error) {
    console.error("Error at /requests/cancelPeerRequest endpoint:", error);
    res.status(500).json({
      error: "Unable to update the request or skills vector",
      details: error.message,
    });
  }
});

router.put("/requests/acceptSupervisorRequest", async (req, res) => {
  try {
    const { senderID, receiverID, courseID } = req.body;

    const senderRequest = await Request.findOne({
      senderID,
    });

    const receiver = await Professor.findOne({ regID: receiverID });
    const sender = await Student.findOne({ regID: senderID });

    if (!senderRequest) {
      return res.status(404).json("No request found for the given regID.");
    }

    await Request.findByIdAndUpdate(
      senderRequest._id,
      {
        type: "supervisor",
        status: "accepted",
      },
      {
        new: true,
        runValidators: true,
      }
    );

    await Student.findByIdAndUpdate(
      sender._id,
      {
        supervisorID: receiverID,
      },
      {
        new: true,
        runValidators: true,
      }
    );

    const hasCourseID = await Professor.exists({
      _id: receiver._id,
      courseStudents: {
        $elemMatch: {
          courseID: courseID,
        },
      },
    });

    if (receiver.courseStudents.length > 0 && hasCourseID) {
      await Professor.updateOne(
        { _id: receiver._id, "courseStudents.courseID": courseID },
        {
          $addToSet: {
            "courseStudents.$.students": {
              studentID: senderID,
              studentName: sender.name,
            },
          },
        }
      );
    } else {
      await Professor.updateOne(
        { _id: receiver._id },
        {
          $addToSet: {
            courseStudents: {
              courseID: courseID,
              students: [
                {
                  studentID: senderID,
                  studentName: sender.name,
                },
              ],
            },
          },
        },
        { upsert: true }
      );
    }

    res.json("Successfully accepted the supervisor request.");
  } catch (error) {
    console.error(
      "Error at /requests/acceptSupervisorRequest endpoint:",
      error
    );
    res.status(500).json({
      error: "Unable to accept the supervisor request",
      details: error.message,
    });
  }
});

module.exports = router;
