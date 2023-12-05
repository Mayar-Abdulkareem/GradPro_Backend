const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const tokenVerification = require("./tokenVerification");

const storeSchema = new mongoose.Schema({
  title: String,
  price: String,
  contact: String,
});

const Store = mongoose.model("Store", storeSchema, "store");

router.get("/store", async (req, res) => {
  try {
    const store = await Store.find({});

    if (!store) {
      res.status(404).json("No Elements in the store");
    } else {
      res.json(store);
    }
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json({ message: "Error during fetching store items" });
  }
});

module.exports = router;
