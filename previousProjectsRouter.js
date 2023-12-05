const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const tokenVerification = require("./tokenVerification");

const previousProjectSchema = new mongoose.Schema({
  name: String,
  projectType: String,
  date: String,
  students: String,
  supervisor: String,
  description: String,
});

const PreviousProject = mongoose.model(
  "PreviousProject",
  previousProjectSchema
);

router.get("/previousProjects", async (req, res) => {
  try {
    const previousProject = await PreviousProject.find({});

    if (!previousProject) {
      res.status(404).json("No Previous Projects To Show");
    } else {
      res.json(previousProject);
    }
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

module.exports = router;
