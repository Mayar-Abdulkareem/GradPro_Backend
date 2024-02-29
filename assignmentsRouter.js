// const express = require("express");
// const router = express.Router();
// const mongoose = require("mongoose");
// const multer = require("multer");
// const storage = multer.memoryStorage();
// const upload = multer({ storage: storage });
// const { ObjectId } = require("mongodb");
// const { Student, Professor } = require("./loginRouter");

// const { Course } = require("./coursesRouter");

// const assignmentSchema = new mongoose.Schema({
//   title: String,
//   courseID: String,
//   deadline: { type: Date, default: Date.now },
//   opened: { type: Date, default: Date.now },
//   file: {
//     fileName: String,
//     content: Buffer,
//     contentType: String,
//   },
// });

// const submissionSchema = new mongoose.Schema({
//   studentID: String,
//   courseID: String,
//   assignmentID: String,
//   file: {
//     fileName: String,
//     content: Buffer,
//     contentType: String,
//   },
//   text: String,
//   supervisorComment: String,
// });

// const Assignment = mongoose.model("Assignment", assignmentSchema);
// const Submission = mongoose.model("Submission", submissionSchema);

// router.post("/assignments", async (req, res) => {
//   try {
//     const courseID = req.body.courseID;
//     const assignments = await Assignment.find({ courseID });
//     return res.json(assignments);
//   } catch (error) {
//     console.error("Error during fetching previous projects:", error);
//     res
//       .status(500)
//       .json({ message: "Error during fetching previous projects" });
//   }
// });

// router.get("/assignments/:assignmentID", async (req, res) => {
//   try {
//     const assignmentID = req.params.assignmentID;
//     const assignment = await Assignment.findOne({
//       _id: new ObjectId(assignmentID),
//     });
//     console.log(assignment);
//     console.log(assignment.file);
//     if (!assignment || assignment.length === 0) {
//       res.json({});
//     } else {
//       res.json({
//         id: assignment._id,
//         title: assignment.title,
//         deadline: assignment.deadline,
//         courseID: assignment.courseID,
//         file: {
//           fileName: (assignment.file && assignment.file.fileName) || "",
//           content:
//             (assignment.file.content &&
//               assignment.file.content.toString("base64")) ||
//             "",
//           contentType: (assignment.file && assignment.file.contentType) || "",
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error during fetching previous projects:", error);
//     res
//       .status(500)
//       .json({ message: "Error during fetching previous projects" });
//   }
// });
// // this is to get the submissions for the supervisors students for a certain assignment , supervisorID and courseID are sent in the body
// router.post("/submissions/getSupervisorSubmissions", async (req, res) => {
//   try {
//     const assignmentID = req.body.assignmentID;
//     const supervisorID = req.body.supervisorID;
//     const students = await Student.find({ supervisorID });
//     const studentIDsArray = students.map((s) => {
//       return s.regID;
//     });
//     // const peerIDsArray = students.map((s) => {
//     //   return s.peerID;
//     // });
//     // console.log(studentIDsArray);
//     // console.log(peerIDsArray);
//     const submissions = await Submission.find({
//       studentID: { $in: studentIDsArray },
//       assignmentID,
//     });

//     const resultArr = [];
//     await Promise.all(
//       submissions.map(async (submission) => {
//         const student = await Student.findOne({ regID: submission.studentID });
//         const peerID = student.peerID;
//         const supervisorID = student.supervisorID;
//         const professor = await Professor.findOne({ regID: supervisorID });
//         return resultArr.push({
//           ...submission._doc,
//           peerID,
//           supervisorID,
//           supervisorName: professor.name,
//         });
//       })
//     );

//     return res.json(resultArr);
//   } catch (error) {
//     console.error("Error during fetching submissions:", error);
//     res.status(500).json({ message: "Error during fetching submissions" });
//   }
// });

// // this api is used to add and edit the student submission

// router.post(
//   "/submissions/addSubmission",
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const assignmentID = req.body.assignmentID;
//       const studentID = req.body.studentID;
//       const courseID = req.body.courseID;
//       const text = req.body.text;
//       console.log(req.file)
//       const newData = {
//         studentID,
//         assignmentID,
//         courseID,
//         file: {
//           fileName: (req.file && req.file.originalname) || "",
//           content: (req.file && req.file.buffer) || "",
//           contentType: (req.file && req.file.mimetype) || "",
//         },
//         text,
//       };

//       const options = {
//         upsert: true,
//         new: true,
//       };

//       const result = await Submission.findOneAndUpdate(
//         { assignmentID, courseID, studentID },
//         newData,
//         options
//       );
//       console.log("********************************************")
//       console.log(result)
//       return res.json({
//         _id: result._id,
//         text: result.text,
//         supervisorComment: result.supervisorComment,
//         file: {
//           fileName: result.file.fileName || "",
//           content: result.file.content.toString("base64") || "",
//           contentType: result.file.contentType || "",
//         },
//       });
//       //return res.json(submission);
//     } catch (error) {
//       console.error("Error during fetching submissions:", error);
//       res.status(500).json({ message: "Error during fetching submissions" });
//     }
//   }
// );

// router.post("/submissions/getSubmissionDetails", async (req, res) => {
//   try {
//     const studentID = req.body.studentID;
//     const courseID = req.body.courseID;
//     const assignmentID = req.body.assignmentID;

//     const result = await Submission.findOne({
//       studentID,
//       courseID,
//       assignmentID,
//     });
//     if (!result || result.length === 0) {
//       res.json({});
//     } else {
//       res.json({
//         _id: result._id,
//         text: result.text,
//         supervisorComment: result.supervisorComment,
//         file: {
//           fileName: result.file.fileName || "",
//           content: result.file.content.toString("base64") || "",
//           contentType: result.file.contentType || "",
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error during fetching previous projects:", error);
//     res
//       .status(500)
//       .json({ message: "Error during fetching previous projects" });
//   }
// });

// router.post("/submissions/editText", async (req, res) => {
//   const { submissionId, newText } = req.body;

//   if (!submissionId || !newText) {
//     return res.status(400).json({ message: "Missing submissionId or newText" });
//   }

//   try {
//     const result = await Submission.findById(submissionId);

//     if (!result) {
//       return res.status(404).json({ message: "Submission not found" });
//     }

//     // Update the text field of the submission
//     result.text = newText;

//     // Save the updated submission
//     await result.save();

//     res.json({
//         _id: result._id,
//         text: result.text,
//         supervisorComment: result.supervisorComment,
//         file: {
//           fileName: result.file.fileName || "",
//           content: result.file.content.toString("base64") || "",
//           contentType: result.file.contentType || "",
//         },
//       });
//   } catch (error) {
//     console.error("Error during submission text update:", error);
//     res.status(500).json({ message: "Error during submission text update" });
//   }
// });



// router.put("/submissions/addComment", async (req, res) => {
//   try {
//     const submissionID = req.body.submissionID;
//     const comment = req.body.comment;
//     await Submission.updateOne(
//       { _id: new ObjectId(submissionID) },
//       { $set: { supervisorComment: comment } }
//     );

//     res.json("");
//   } catch (error) {
//     console.error("Error during adding a comment to the submission:", error);
//     res
//       .status(500)
//       .json({ message: "Error during adding a comment to the submission" });
//   }
// });

// router.delete("/submissions/:submissionID", async (req, res) => {
//   try {
//     let submissionID = req.params.submissionID;
//     let objectID = mongoose.Types.ObjectId;
//     let newID = new objectID(submissionID);

//     const submission = await Submission.findByIdAndDelete(newID);
//     if (!submission) {
//       return res.json("No submission");
//     }
//     res.json("Submission deleted successfully");
//   } catch (error) {
//     console.log(error);
//     res.status(500).json("Unable to delete the item");
//   }
// });

// // ============================== ADMIN ===========================
// router.get("/assignments", async (req, res) => {
//   try {
//     const assignments = await Assignment.find({});
//     const resultArr = [];
//     await Promise.all(
//       assignments.map(async (assignment) => {
//         const course = await Course.findOne({ courseID: assignment.courseID });
//         return resultArr.push({
//           ...assignment._doc,
//           courseID: assignment.courseID,
//           courseName: course.courseName,
//         });
//       })
//     );
//     return res.json(resultArr);
//   } catch (error) {
//     console.error("Error during fetching previous projects:", error);
//     res
//       .status(500)
//       .json({ message: "Error during fetching previous projects" });
//   }
// });

// router.post("/submissions/getAssignmentSubmissions", async (req, res) => {
//   try {
//     const assignmentID = req.body.assignmentID;

//     const submissions = await Submission.find({
//       assignmentID,
//     });

//     const resultArr = [];
//     await Promise.all(
//       submissions.map(async (submission) => {
//         const student = await Student.findOne({ regID: submission.studentID });
//         const peerID = student.peerID;
//         const supervisorID = student.supervisorID;
//         const professor = await Professor.findOne({ regID: supervisorID });
//         console.log(student);
//         console.log(professor);
//         return resultArr.push({
//           ...submission._doc,
//           peerID,
//           supervisorID,
//           supervisorName: professor.name,
//         });
//       })
//     );
//     // console.log(resultArr);
//     return res.json(resultArr);
//   } catch (error) {
//     console.error("Error during fetching submissions:", error);
//     res.status(500).json({ message: "Error during fetching submissions" });
//   }
// });

// router.delete("/assignment/:assignmentID", async (req, res) => {
//   try {
//     let assignmentID = req.params.assignmentID;
//     let objectID = mongoose.Types.ObjectId;
//     let newID = new objectID(assignmentID);

//     const assignment = await Assignment.findByIdAndDelete(newID);
//     if (!assignment) {
//       return res.json([]);
//     }
//     res.json("Assginment deleted successfully");
//   } catch (error) {
//     console.log(error);
//     res.status(500).json("Unable to delete the item");
//   }
// });

// router.post(
//   "/assignments/addAssignment",
//   upload.single("file"),
//   async (req, res) => {
//     try {
//       const { title, courseID, deadline } = req.body;

//       const newData = new Assignment({
//         title,
//         courseID,
//         deadline,
//         file: {
//           fileName: (req.file && req.file.originalname) || "",
//           content: (req.file && req.file.buffer) || "",
//           contentType: (req.file && req.file.mimetype) || "",
//         },
//       });

//       newData.save();
//       return res.json("assignment added successfully");
//     } catch (error) {
//       console.error("Error during adding assignment:", error);
//       res.status(500).json({ message: "Error during adding assignment" });
//     }
//   }
// );

// module.exports = router;

const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { ObjectId } = require("mongodb");
const { Student, Professor } = require("./loginRouter");

const { Course } = require("./coursesRouter");

const assignmentSchema = new mongoose.Schema({
  title: String,
  courseID: String,
  opened: { type: Date, default: Date.now },
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

router.get("/assignments/:assignmentID", async (req, res) => {
  try {
    const assignmentID = req.params.assignmentID;
    const assignment = await Assignment.findOne({
      _id: new ObjectId(assignmentID),
    });
    if (!assignment || assignment.length === 0) {
      res.json({});
    } else {
      res.json({
        id: assignment._id,
        title: assignment.title,
        deadline: assignment.deadline,
        opened: assignment.opened,
        courseID: assignment.courseID,
        file: {
          fileName: (assignment.file && assignment.file.fileName) || "",
          content:
            (assignment.file.content &&
              assignment.file.content.toString("base64")) ||
            "",
          contentType: (assignment.file && assignment.file.contentType) || "",
        },
      });
    }
  } catch (error) {
    console.error("Error during fetching assignments:", error);
    res.status(500).json({ message: "Error during fetching assignments" });
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
    const submissions = await Submission.find({
      studentID: { $in: studentIDsArray },
      assignmentID,
    });

    const resultArr = [];
    await Promise.all(
      submissions.map(async (submission) => {
        const student = await Student.findOne({ regID: submission.studentID });
        const peerID = student.peerID;
        const peer = await Student.findOne({ regID: peerID });
        const supervisorID = student.supervisorID;
        const professor = await Professor.findOne({ regID: supervisorID });
        console.log(submission._doc.file);
        return resultArr.push({
          ...submission._doc,
          file: {
            fileName:
              (submission._doc.file && submission._doc.file.fileName) || "",
            content:
              (submission._doc.file.content &&
                submission._doc.file.content.toString("base64")) ||
              "",
            contentType:
              (submission._doc.file && submission._doc.file.contentType) || "",
          },
          studentName: student.name,
          peerID,
          peerName: peer ? peer.name : "",
          supervisorID,
          supervisorName: professor ? professor.name : "",
        });
      })
    );
    return res.json(resultArr);
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
      return res.json({
        _id: submission._id,
        text: submission.text,
        supervisorComment: submission.supervisorComment,
        file: {
          fileName: submission.file.fileName || "",
          content: submission.file.content.toString("base64") || "",
          contentType: submission.file.contentType || "",
        },
      });
    } catch (error) {
      console.error("Error during fetching submissions:", error);
      res.status(500).json({ message: "Error during fetching submissions" });
    }
  }
);

// router.post("/submissions/getSubmissionDetails", async (req, res) => {
//   try {
//     const studentID = req.body.studentID;
//     const courseID = req.body.courseID;
//     const assignmentID = req.body.assignmentID;

//     const result = await Submission.findOne({
//       studentID,
//       courseID,
//       assignmentID,
//     });
//     if (!result || result.length === 0) {
//       res.json({});
//     } else {
//       res.json({
//         id: result._id,
//         text: result.text,
//         supervisorComment: result.supervisorComment,
//         file: {
//           fileName: result.file.fileName || "",
//           content: result.file.content.toString("base64") || "",
//           contentType: result.file.contentType || "",
//         },
//       });
//     }
//   } catch (error) {
//     console.error("Error during fetching submission:", error);
//     res.status(500).json({ message: "Error during fetching submission" });
//   }
// });

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
      res.json({
        _id: result._id,
        text: result.text,
        supervisorComment: result.supervisorComment,
        file: {
          fileName: result.file.fileName || "",
          content: result.file.content.toString("base64") || "",
          contentType: result.file.contentType || "",
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

router.post("/submissions/editText", async (req, res) => {
  const { submissionId, newText } = req.body;

  if (!submissionId || !newText) {
    return res.status(400).json({ message: "Missing submissionId or newText" });
  }

  try {
    const result = await Submission.findById(submissionId);

    if (!result) {
      return res.status(404).json({ message: "Submission not found" });
    }

    // Update the text field of the submission
    result.text = newText;

    // Save the updated submission
    await result.save();

    res.json({
      _id: result._id,
      text: result.text,
      supervisorComment: result.supervisorComment,
      file: {
        fileName: result.file.fileName || "",
        content: result.file.content.toString("base64") || "",
        contentType: result.file.contentType || "",
      },
    });
  } catch (error) {
    console.error("Error during submission text update:", error);
    res.status(500).json({ message: "Error during submission text update" });
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

// ============================== ADMIN ===========================
router.post("/assignments", async (req, res) => {
  try {
    const filter = {};
    // Add filters based on request body
    if (req.body.title) {
      filter.title = { $regex: new RegExp(req.body.title, "i") }; // Case-insensitive regex match
    }

    if (req.body.courseID && req.body.courseID.length > 0) {
      filter.courseID = req.body.courseID;
    }

    // Fetch store items and total count
    const assignments = await Assignment.find(filter);
    // const assignments = await Assignment.find({});
    const resultArr = [];
    await Promise.all(
      assignments.map(async (assignment) => {
        const course = await Course.findOne({ courseID: assignment.courseID });
        return resultArr.push({
          ...assignment._doc,
          file: {
            fileName:
              (assignment._doc.file && assignment._doc.file.fileName) || "",
            content:
              (assignment._doc.file.content &&
                assignment._doc.file.content.toString("base64")) ||
              "",
            contentType:
              (assignment._doc.file && assignment._doc.file.contentType) || "",
          },
          courseID: assignment.courseID,
          courseName: course.courseName,
        });
      })
    );
    return res.json(resultArr);
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

router.post("/submissions/getAssignmentSubmissions", async (req, res) => {
  try {
    const assignmentID = req.body.assignmentID;
    const allSubmissions = await Submission.find({ assignmentID });
    let editedAllSubmissions = [];
    await Promise.all(
      allSubmissions.map(async (submission) => {
        const student = await Student.findOne({ regID: submission.studentID });
        const peerID = student.peerID;
        const peer = await Student.findOne({ regID: peerID });
        const supervisorID = student.supervisorID;
        const professor = await Professor.findOne({ regID: supervisorID });
        return editedAllSubmissions.push({
          ...submission._doc,
          file: {
            fileName:
              (submission._doc.file && submission._doc.file.fileName) || "",
            content:
              (submission._doc.file.content &&
                submission._doc.file.content.toString("base64")) ||
              "",
            contentType:
              (submission._doc.file && submission._doc.file.contentType) || "",
          },
          studentName: student.name,
          peerID,
          peerName: peer ? peer.name : "",
          supervisorID,
          supervisorName: professor.name,
        });
      })
    );

    let resultArr = [...editedAllSubmissions];
    if (req.body.searchVal && !req.body.searchBy) {
      resultArr = editedAllSubmissions.filter(
        (element) =>
          element.studentName
            .toLowerCase()
            .includes(req.body.searchVal.toLowerCase()) ||
          element.peerName
            .toLowerCase()
            .includes(req.body.searchVal.toLowerCase())
      );
    }
    if (req.body.searchVal && req.body.searchBy) {
      if (req.body.searchBy.toLowerCase() === "students") {
        resultArr = editedAllSubmissions.filter(
          (element) =>
            element.studentName
              .toLowerCase()
              .includes(req.body.searchVal.toLowerCase()) ||
            element.peerName
              .toLowerCase()
              .includes(req.body.searchVal.toLowerCase())
        );
      } else if (req.body.searchBy.toLowerCase() === "supervisor") {
        resultArr = editedAllSubmissions.filter((element) =>
          element.supervisorName
            .toLowerCase()
            .includes(req.body.searchVal.toLowerCase())
        );
      }
    }
    return res.json(resultArr);
  } catch (error) {
    console.error("Error during fetching submissions:", error);
    res.status(500).json({ message: "Error during fetching submissions" });
  }
});

router.delete("/assignment/:assignmentID", async (req, res) => {
  try {
    let assignmentID = req.params.assignmentID;
    let objectID = mongoose.Types.ObjectId;
    let newID = new objectID(assignmentID);

    const assignment = await Assignment.findByIdAndDelete(newID);
    if (!assignment) {
      return res.json([]);
    }
    res.json("Assginment deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Unable to delete the item");
  }
});

router.post(
  "/assignments/addAssignment",
  upload.single("file"),
  async (req, res) => {
    try {
      const { title, courseID, opened, deadline } = req.body;

      const newData = new Assignment({
        title,
        courseID,
        opened,
        deadline,
        file: {
          fileName: (req.file && req.file.originalname) || "",
          content: (req.file && req.file.buffer) || "",
          contentType: (req.file && req.file.mimetype) || "",
        },
      });

      newData.save();
      return res.json("assignment added successfully");
    } catch (error) {
      console.error("Error during adding assignment:", error);
      res.status(500).json({ message: "Error during adding assignment" });
    }
  }
);

router.post(
  "/assignment/update/:assignmentID",
  upload.single("file"),
  async (req, res) => {
    try {
      console.log(req.file);
      let assignmentID = req.params.assignmentID;
      const update = {};

      ["title", "courseID", "deadline"].forEach((field) => {
        if (req.body[field]) update[field] = req.body[field];
      });

      if (req.file) {
        update.file = {
          fileName: req.file.originalname,
          content: req.file.buffer,
          contentType: req.file.mimetype,
        };
      }

      const updatedAssignment = await Assignment.findByIdAndUpdate(
        assignmentID,
        update,
        { new: true }
      );
      if (!updatedAssignment) {
        return res.status(404).json({ message: "Assignment Not Found" });
      }
      res.status(200).json("assignment updated successfully");
    } catch (error) {
      console.error("Error during updating the assignmentm:", error);
      res
        .status(500)
        .json({ message: "Error during updating the assignmentm" });
    }
  }
);

module.exports = router;
