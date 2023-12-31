const express = require("express");
const router = express.Router();
const { Course } = require("./coursesRouter");
const { Professor } = require("./loginRouter");

router.get("/courseProfessors/:courseID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const course = await Course.findOne({ courseID });

    const professors = course.professors;

    await Promise.all(
      professors.map(async (p, index) => {
        const professor = await Professor.findOne({ regID: p.id });
        return (professors[index] = {
          ...p,
          students: professor.students,
        });
      })
    );

    // console.log(course);
    console.log(professors);
    if (!professors) {
      res.json([]);
    } else {
      res.json(professors);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during Fetching Professors" });
  }
});

module.exports = router;
