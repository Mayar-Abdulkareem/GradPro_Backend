const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const previousProjectSchema = new mongoose.Schema({
  name: String,
  projectType: String,
  date: String,
  students: String,
  supervisor: String,
  description: String,
  link: String,
});

const PreviousProject = mongoose.model(
  "PreviousProject",
  previousProjectSchema
);

const PAGE_SIZE = 6;

router.get("/previousProjects/projectTypes", async (req, res) => {
  try {
    const projectTypes = await PreviousProject.distinct("projectType");
    res.json(projectTypes);
  } catch (error) {
    res
      .status(500)
      .json({ message: "Error retrieving project types", error: error });
  }
});

router.post("/previousProjects", async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const filter = {};

    // Add filters based on request body
    if (req.body.projectName) {
      filter.name = { $regex: new RegExp(req.body.projectName, "i") }; // Case-insensitive regex match
    }

    if (req.body.projectType.length > 0) {
      filter.projectType = req.body.projectType;
    }

    const sort = {};

    // Add sorting based on request body
    if (req.body.sortByDate) {
      sort.date = req.body.sortByDate === "asc" ? 1 : -1; // 1 for ascending, -1 for descending
    }

    const [previousProjects, totalCount] = await Promise.all([
      PreviousProject.find(filter)
        .collation({ locale: "en_US", numericOrdering: true })
        .sort(sort)
        .skip(skip)
        .limit(PAGE_SIZE),
      PreviousProject.countDocuments(filter),
    ]);

    if (!previousProjects || previousProjects.length === 0) {
      res.json({
        totalCount: 0,
        previousProjects: [], // Return an empty array
      });
    } else {
      res.json({
        totalCount: totalCount,
        previousProjects: previousProjects,
      });
    }
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
  }
});

module.exports = router;
