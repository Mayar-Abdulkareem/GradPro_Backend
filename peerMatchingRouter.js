const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student } = require("./loginRouter");
const { Tag } = require("./tagsRouter");

router.post("/peerMatching/sameSkills", async (req, res) => {
  const regID = req.body.regID;
  const courseID = req.body.courseID;
  try {
    const student = await Student.findOne({ regID })
    if (!student) {
      res.json([]);
    } else {
      console.log(student.skillsVector)
      let inputVec = student.skillsVector.split('').map(Number)
      const result = await matchByVector(inputVec, courseID);
      console.log(result);
      res.json( result );
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.post("/peerMatching/oppositeSkills", async (req, res) => {
  const regID = req.body.regID;
  const courseID = req.body.courseID;
  try {
    const student = await Student.findOne({ regID })
    if (!student) {
      res.json([]);
    } else {
      let inputVec = student.skillsVector.split('').map(char => (char === '0' ? 1 : 0));
      const result = await matchByVector(inputVec, courseID, regID);
      res.json( result );
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.post("/peerMatching/customSkills", async (req, res) => {
  const regID = req.body.regID;
  const studentVector = req.body.studentVector
  const courseID = req.body.courseID;
  try {
    const student = await Student.findOne({ regID })
    if (!student) {
      res.json([]);
    } else {
      let inputVec = studentVector.split('').map(Number)
      const result = await matchByVector(inputVec, courseID, regID);
      res.json( result );
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

function dotProduct(vecA, vecB) {
  return vecA.map((item, index) => item * vecB[index]).reduce((sum, current) => sum + current, 0);
}

function magnitude(vec) {
  return Math.sqrt(vec.reduce((sum, current) => sum + current * current, 0));
}

function cosineSimilarity(vecA, vecB) {
  return dotProduct(vecA, vecB) / (magnitude(vecA) * magnitude(vecB));
}

async function matchByVector(studentVector, courseID, regID) {
  let zeroesVector = "0".repeat(studentVector.length);
  try {
    const students = await Student.find({
      skillsVector: { $ne: zeroesVector },
      regID: { $ne: regID },
      courses: { 
        $elemMatch: { 
          courseID: courseID,
          status: "registered"
        } 
      },
      peerID: { $exists: false }  
    });
  console.log(students)
    const updatedStudents = students.map(student => {
        return { 
          ...student, 
          skillsVector: student.skillsVector.split('').map(Number)
      }
    });
    let matches = updatedStudents
      .map(student => ({
          ...student._doc,
          similarity: ((cosineSimilarity(studentVector, student.skillsVector))*100).toFixed(2) + '%'
      }));  

    matches.sort((a, b) => b.similarity - a.similarity)
    return matches
} catch (error) {
  console.error("Error during login:", error);
}
}

module.exports = router;