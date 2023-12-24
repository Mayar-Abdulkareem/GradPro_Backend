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

const PAGE_SIZE = 6;

router.post("/store", async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const filter = {};

    // Add filters based on request body
    if (req.body.title) {
      filter.title = { $regex: new RegExp(req.body.title, "i") }; // Case-insensitive regex match
    }

    if (req.body.regID) {
      filter.regID = req.body.regID;
    }

    const sort = {};

    // Add sorting based on request body
    if (req.body.sortByPrice) {
      sort.price = req.body.sortByPrice === "asc" ? 1 : -1; // 1 for ascending, -1 for descending
    }

    const [storeItems, totalCount] = await Promise.all([
      Store.find(filter)
        .collation({ locale: "en_US", numericOrdering: true })
        .sort(sort)
        .skip(skip)
        .limit(PAGE_SIZE),
      Store.countDocuments(filter),
    ]);

    const resultArr = [];
    storeItems.forEach((item) => {
      const imageData = {
        contentType: item.image.contentType,
        data: item.image.data.toString("base64"),
      };
      resultArr.push({
        id: item._id,
        regID: item.regID,
        title: item.title,
        price: item.price,
        contact: item.contact,
        image: imageData,
      });
    });

    if (!storeItems || storeItems.length === 0) {
      res.json({
        totalCount: 0,
        currentPage: page,
        pageSize: PAGE_SIZE,
        storeItems: [], // Return an empty array
      });
    } else {
      res.json({
        totalCount: totalCount,
        currentPage: page,
        pageSize: PAGE_SIZE,
        storeItems: resultArr,
      });
    }
  } catch (error) {
    console.error("Error during fetching previous projects:", error);
    res
      .status(500)
      .json({ message: "Error during fetching previous projects" });
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

router.delete("/store/:storeItemID", async (req, res) => {
  try {
    let storeItemID = req.params.storeItemID;
    let objectID = mongoose.Types.ObjectId;
    let newID = new objectID(storeItemID);

    const store = await Store.findByIdAndDelete(newID);
    if (!store) {
      return res.status(404).json("Store Item Not Found");
    }
    res.json("Item deleted successfully");
  } catch (error) {
    console.log(error);
    res.status(500).json("Unable to delete the item");
  }
});

module.exports = router;
