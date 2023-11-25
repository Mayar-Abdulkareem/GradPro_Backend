const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const userSchema = new mongoose.Schema({
  regID: String,
  password: String,
});

const Student = mongoose.model("Student", userSchema);
const Professor = mongoose.model("Professor", userSchema);

router.post("/login", async (req, res) => {
  const { regID, password } = req.body;

  console.log("hello");

  try {
    const student = await Student.findOne({ regID });
    let role;

    console.log(student);
    console.log(password);
    if (!student) {
      const professor = await Professor.findOne({ regID });
      if (!professor) {
        return res
          .status(401)
          .json({ message: "Invalid registeration Number" });
      } else if (!(await bcrypt.compare(password, professor.password))) {
        return res.status(401).json({ message: "Wrong Password!" });
      }
      role = "professor";
    } else if (!(await bcrypt.compare(password, student.password))) {
      return res.status(401).json({ message: "Wrong Password!" });
    } else {
      role = "student";
    }

    // bcrypt.genSalt(10, (err, salt) => {
    //   if (err) {
    //     console.error("Error generating salt:", err);
    //     return;
    //   }

    //   // Hash the value with the generated salt (asynchronous)
    //   bcrypt.hash(password, salt, (err, hash) => {
    //     if (err) {
    //       console.error("Error hashing value:", err);
    //       return;
    //     }

    //     // The 'hash' variable now contains the hashed value
    //     console.log("Hashed Value:", hash);

    //     // You can store or use the 'hash' variable as needed
    //   });
    // });

    // (
    const accessToken = jwt.sign(
      { regID: regID, role: role },
      process.env.JWT_SECRET
    );

    res.json({ accessToken, role: role });
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
