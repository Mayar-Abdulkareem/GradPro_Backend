const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student } = require("./loginRouter");
const { Tag } = require("./tagsRouter");

router.post("/peerMatching/sameVector/:regID", async (req, res) => {
  const regID = req.params.regID;
  const 
  try {
    const student = await Student.findOne({ regID });

    if (!student) {
      res.json([]);
    } else {
      const studentVector = student.skillsVector;
     
      res.json(finishedCourses);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});


function matchByVector(studentVector) {
    let zeroesVector = "" ;
     studentVector.forEach(
        c => {
            zeroesVector += '0' ;
            return ;
        }
     )

}