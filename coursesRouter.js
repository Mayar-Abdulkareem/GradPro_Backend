const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student } = require("./loginRouter");
const tokenVerification = require("./tokenVerification");

const courseSchema = new mongoose.Schema({
  courseID: String,
  courseName: String,
  available: Boolean,
});

const Course = mongoose.model("Course", courseSchema);

router.get("/registeredCourses/:regID", tokenVerification, async (req, res) => {
  const regID = req.params.regID;
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      res.status(404).json("No Student Found with this registeration number");
    } else {
      let registeredCourses = {};

      Object.keys(student.courses).forEach((key) => {
        if (student.courses[key].status === "registered") {
          registeredCourses[key] = {
            supervisor: student.courses[key].supervisor,
          };
        }
      });

      let resultObj = {};

      await Promise.all(
        Object.keys(registeredCourses).map(async (key) => {
          const course = await Course.findOne({ courseID: key });
          return (resultObj[course.courseName] = {
            supervisor: registeredCourses[key].supervisor,
          });
        })
      );
      res.json(resultObj);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.get("/finishedCourses/:regID", tokenVerification, async (req, res) => {
  const regID = req.params.regID;
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      res.status(404).json("No Student Found with this registeration number");
    } else {
      let finishedCourses = [];

      Object.keys(student.courses).forEach((key) => {
        if (student.courses[key].status === "finished") {
          finishedCourses.push(key);
        }
      });

      res.json(finishedCourses);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.get("/courses", async (req, res) => {
  try {
    const course = await Course.find();

    if (!course) {
      res.status(404).json("Error finding data in courses collection");
    } else {
      const courses = [];
      course.forEach((item) => {
        if (item.available === true) {
          courses.push(item);
        }
      });
      res.json(courses);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
