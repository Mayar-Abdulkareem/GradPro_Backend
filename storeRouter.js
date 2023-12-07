const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const tokenVerification = require("./tokenVerification");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const storeSchema = new mongoose.Schema({
  regID: String,
  title: String,
  price: String,
  contact: String,
  image: {
    data: Buffer,
    contentType: String,
  },
});

const Store = mongoose.model("Store", storeSchema, "store");

router.get("/store", async (req, res) => {
  try {
    const store = await Store.find({});
    // console.log(store.image);

    const resultArr = [];

    store.forEach((item) => {
      const imageData = {
        contentType: item.image.contentType,
        data: item.image.data.toString("base64"),
      };
      resultArr.push({
        regID: item.regID,
        title: item.title,
        price: item.price,
        contact: item.contact,
        image: imageData,
      });
    });

    if (!store) {
      res.status(404).json("No Elements in the store");
    } else {
      res.json(resultArr);
    }
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json({ message: "Error during fetching store items" });
  }
});

router.post("/store/addItem", upload.single("image"), async (req, res) => {
  try {
    console.log("req.file:", req.file);
    const storeItem = new Store({
      regID: req.body.regID,
      title: req.body.title,
      price: req.body.price,
      contact: req.body.contact,
      image: {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      },
    });
    const store = await storeItem.save();

    if (!store) {
      res.status(404).json("Failed to Insert The Item to the Store");
    } else {
      res.json(store);
    }
  } catch (error) {
    console.error("Error during Inserting The Item to the Store:", error);
    res
      .status(500)
      .json({ message: "Error during Inserting The Item to the Store" });
  }
});

module.exports = router;
