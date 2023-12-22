const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const tagSchema = new mongoose.Schema({
  for: String,
  values: Object,
});

const Tag = mongoose.model("Tag", tagSchema);

router.get("/tags/:for", async (req, res) => {
  const type = req.params.for;
  try {
    const tag = await Tag.findOne({ for: type });

    if (!tag) {
      res.json([]);
    } else {
      res.json(tag.values);
    }
  } catch (error) {
    console.error("Error during login:", error);
    res.status(500).json({ message: "Error during login" });
  }
});

module.exports = router;
exports.Tag = Tag;
