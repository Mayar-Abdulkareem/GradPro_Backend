const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const studentSchema = new mongoose.Schema({
  regID: String,
  password: String,
  courses: Array,
  skillsVector: String,
  peerID: String,
  supervisorID: String,
  email: String,
  name: String,
  phoneNumber: String,
  GPA: String,
  profileImage: String,
});

const adminSchema = new mongoose.Schema({
  ID: String,
  password: String,
  profileImage: String,
});

const professorSchema = new mongoose.Schema({
  regID: String,
  password: String,
  name: String,
  email: String,
  courseStudents: Array,
  profileImage: String,
});

const Student = mongoose.model("Student", studentSchema);
const Professor = mongoose.model("Professor", professorSchema);
const Admin = mongoose.model("Admin", adminSchema);

router.post("/login", async (req, res) => {
  const { regID, password } = req.body;
  try {
    const student = await Student.findOne({ regID });
    let role;
    if (!student) {
      const professor = await Professor.findOne({ regID });

      if (!professor) {
        const admin = await Admin.findOne({ ID: regID });

        if (!admin) {
          return res
            .status(401)
            .json({ message: "Invalid registeration Number" });
        } else if (password !== admin.password) {
          return res.status(401).json({ message: "Wrong Password!" });
        } else {
          role = "admin";
        }
      } else if (password !== professor.password) {
        return res.status(401).json({ message: "Wrong Password!" });
      } else {
        // if (professor.moderator) {
        //   role = "moderator";
        // } else {
        role = "supervisor";
        // }
      }
    } else if (password !== student.password) {
      return res.status(401).json({ message: "Wrong Password!" });
    } else {
      role = "student";
    }

    const accessToken = jwt.sign(
      { regID: regID, role: role },
      process.env.JWT_SECRET,
      { expiresIn: 40 }
    );

    res.json({ accessToken, role: role });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

router.put("/student/updateSkillsVector", async (req, res) => {
  const { regID, skillsVector } = req.body;

  if (!regID || !skillsVector) {
    return res
      .status(400)
      .json("Registration ID and Skills Vector are required.");
  }

  try {
    const updatedStudent = await Student.findOneAndUpdate(
      { regID: regID },
      { $set: { skillsVector: skillsVector } },
      { new: true }
    );

    if (!updatedStudent) {
      return res.status(404).json("Student not found.");
    }

    res.json("Skills Vector updated successfully.");
  } catch (error) {
    console.error("Error during skills vector update:", error);
    res.status(500).json({ message: "Error during skills vector update" });
  }
});

exports.loginRoutes = router;
exports.Student = Student;
exports.Professor = Professor;
exports.Admin = Admin;
