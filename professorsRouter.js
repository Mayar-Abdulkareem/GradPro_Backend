const express = require("express");
const router = express.Router();
const { Course } = require("./coursesRouter");
const { Professor } = require("./loginRouter");

// router.get("/courseProfessors/:courseID", async (req, res) => {
//   try {
//     const courseID = req.params.courseID;
//     const course = await Course.findOne({ courseID });

//     const professors = course.professors;

//     await Promise.all(
//       professors.map(async (p, index) => {
//         const professor = await Professor.findOne({ regID: p.id });
//         return (professors[index] = {
//           ...p,
//           students: professor.students,
//         });
//       })
//     );

//     console.log(professors);
//     if (!professors) {
//       res.json([]);
//     } else {
//       res.json(professors);
//     }
//   } catch (error) {
//     console.error("Error during login:", error);
//     res.status(500).json({ message: "Error during Fetching Professors" });
//   }
// });


router.get("/availableProfessors/:courseID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const course = await Course.findOne({ courseID: courseID });

    if (!course || !course.professors) {
      return res.status(404).json("Course not found or no professors associated with it");
    }

    const professorsWithCourseFullStatus = await Promise.all(
      course.professors.map(async (professor) => {
        const professorDetail = await Professor.findOne({ regID: professor.id });

        if (!professorDetail || !Array.isArray(professorDetail.courseStudents)) {
          console.log(`Professor detail not found or courseStudents not an array for regID: ${professor.id}`);
          return null; // Skip this professor as the details are not correct
        }

        const courseStudentsEntry = professorDetail.courseStudents.find(entry => entry.courseID === courseID);
        const isFull = courseStudentsEntry && courseStudentsEntry.students.length >= 12; // Ensure there are 12 or more students

        return {
          regID: professorDetail.regID,
          name: professorDetail.name,
          isFull: isFull
        };
      })
    );

    const filteredProfessors = professorsWithCourseFullStatus.filter(p => p !== null);
    if (filteredProfessors.length === 0) {
      console.log("Filtered professors is an empty array, possibly all entries were null");
    }
    res.json(filteredProfessors);
  } catch (error) {
    console.error("Error during Fetching Professors:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
});



module.exports = router;
