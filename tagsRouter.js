const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  for: String,
  categories: [
    {
      category: String,
      skills: [String],
      courseID: String,
    },
  ],
});

const Tag = mongoose.model("Tag", tagSchema);

router.get("/tags/student/:courseID", async (req, res) => {
  const courseID = req.params.courseID || null;

  try {
    const tag = await Tag.findOne({ for: "student" });

    if (!tag || !tag.categories) {
      res.json([]);
    } else {
      const filteredCategories = tag.categories.filter((category) => {
        return category.courseID === null || category.courseID === courseID;
      });

      const formattedCategories = filteredCategories.map((category) => {
        return {
          title: category.category,
          skills: category.skills.map((skill) => ({
            title: skill,
            isSelected: false,
          })),
        };
      });

      res.json(formattedCategories);
    }
  } catch (error) {
    console.error("Error retrieving categories:", error);
    res.status(500).json({ message: "Error retrieving categories" });
  }
});

module.exports = router;
exports.Tag = Tag;
