const express = require("express");
const router = express.Router();
const { Professor } = require("./loginRouter");

router.get("/professors/:courseID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const professors = await Professor.find({ courses: courseID });

    if (!professors) {
      res.status(404).json("No Professors Found");
    } else {
      res.json(professors);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during Fetching Professors" });
  }
});

module.exports = router;
