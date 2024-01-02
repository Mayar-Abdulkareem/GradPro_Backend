const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student, Professor } = require("./loginRouter");
const tokenVerification = require("./tokenVerification");

const courseSchema = new mongoose.Schema({
  courseID: String,
  courseName: String,
  available: Boolean,
  professors: Array,
});

const Course = mongoose.model("Course", courseSchema);

// this api is to get the student registered courses

router.get("/registeredCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
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

// this api is to get the available courses for this semester

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
    console.error("Error during fetching courses:", error);
    res.status(500).json({ message: "Error during fetching courses" });
  }
});

//

router.get("/supervisorCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
  try {
    const courses = await Course.find({
      professors: {
        $elemMatch: {
          id: regID,
        },
      },
    });
    if (!courses) {
      res.status(404).json("No professor Found with this registeration number");
    } else {
      const resultArr = courses.map((course) => {
        return {
          courseID: course.courseID,
          courseName: course.courseName,
        };
      });
      res.json(resultArr);
    }
  } catch (error) {
    console.error("Error during fetching professors courses:", error);
    res
      .status(500)
      .json({ message: "Error during fetching professors courses" });
  }
});

// this api is to get the courses the user can register

router.get("/availableCourses/:regID", async (req, res) => {
  const regID = req.params.regID;
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      return res
        .status(404)
        .json("No Student Found with this registration number");
    } else {
      const allCourses = await Course.find({ available: true });

      let availableCourses = allCourses.filter(
        (course) =>
          !student.courses.some(
            (studentCourse) =>
              studentCourse.courseID === course.courseID &&
              (studentCourse.status === "registered" ||
                studentCourse.status === "finished")
          )
      );

      res.json(availableCourses);
    }
  } catch (error) {
    console.error("Error during operation:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});

exports.coursesRoutes = router;
exports.Course = Course;
