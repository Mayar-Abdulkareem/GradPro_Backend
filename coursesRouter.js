const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student, Professor } = require("./loginRouter");
const tokenVerification = require("./tokenVerification");

const courseSchema = new mongoose.Schema({
  courseID: String,
  courseName: String,
  available: Boolean,
});

const Course = mongoose.model("Course", courseSchema);

router.get("/registeredCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
  console.log(regID);
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      res.status(404).json("No Student Found with this registeration number");
    } else {
      let registeredCourses = [];

      student.courses.forEach((course) => {
        if (course.status === "registered") {
          registeredCourses.push({
            courseID: course.courseID,
            supervisorID: course.supervisorID,
          });
        }
      });

      await Promise.all(
        registeredCourses.map(async (registeredCourse, index) => {
          const course = await Course.findOne({
            courseID: registeredCourse.courseID,
          });
          const professor = await Professor.findOne({
            regID: registeredCourse.supervisorID,
          });
          return (registeredCourses[index] = {
            ...registeredCourse,
            courseName: course.courseName,
            supervisorName: professor.name,
          });
        })
      );
      res.json(registeredCourses);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.get("/finishedCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      res.status(404).json("No Student Found with this registeration number");
    } else {
      let finishedCourses = [];

      student.courses.forEach((c) => {
        if (c.status === "finished") {
          finishedCourses.push(c);
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

router.get("/supervisorCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
  try {
    const professor = await Professor.findOne({ regID });
    if (!professor) {
      res.status(404).json("No professor Found with this registeration number");
    } else {
      let courses = professor.courses.map((course) => {
        return course;
      });
      await Promise.all(
        courses.map(async (c, index) => {
          const course = await Course.findOne({
            courseID: c,
          });
          return (courses[index] = {
            courseID: course.courseID,
            courseName: course.courseName,
          });
        })
      );
      res.json(courses);
    }
  } catch (error) {
    console.error("Error during fetching professors courses:", error);
    res
      .status(500)
      .json({ message: "Error during fetching professors courses" });
  }
});

module.exports = router;
