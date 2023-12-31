const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student } = require("./loginRouter");
const tokenVerification = require("./tokenVerification");
const multer = require("multer");
const axios = require("axios");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

const storeSchema = new mongoose.Schema({
  regID: String,
  title: String,
  price: String,
  image: String,
  // image: {
  //   data: Buffer,
  //   contentType: String,
  // },
  location: String,
  quantity: String,
  showPhoneNumber: Boolean,
});

const Store = mongoose.model("Store", storeSchema, "store");

const PAGE_SIZE = 8;

router.post("/store", async (req, res) => {
  try {
    const page = parseInt(req.body.page) || 1;
    const skip = (page - 1) * PAGE_SIZE;

    const filter = {};
    console.log(req.body.regID);

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

    // Fetch store items and total count
    const [storeItems, totalCount] = await Promise.all([
      Store.find(filter)
        .collation({ locale: "en_US", numericOrdering: true })
        .sort(sort)
        .skip(skip)
        .limit(PAGE_SIZE),
      Store.countDocuments(filter),
    ]);

    // Collect all unique regIDs from the storeItems
    const uniqueRegIDs = [...new Set(storeItems.map((item) => item.regID))];

    // Fetch student details for the collected regIDs
    const students = await Student.find({ regID: { $in: uniqueRegIDs } });

    // Map students by regID for quick access
    const studentMap = {};
    students.forEach((student) => {
      studentMap[student.regID] = {
        name: student.name,
        email: student.email,
        phoneNumber: student.phoneNumber,
      };
    });

    // Construct result array with store items and corresponding student details
    const resultArr = storeItems.map((item) => {
      const studentDetails = studentMap[item.regID] || {};
      return {
        id: item._id,
        regID: item.regID,
        title: item.title,
        price: item.price,
        quantity: item.quantity,
        location: item.location,
        image: item.image,
        name: studentDetails.name,
        email: studentDetails.email,
        phoneNumber: studentDetails.phoneNumber,
        showPhoneNumber: item.showPhoneNumber,
      };
    });

    // Send response
    res.json({
      totalCount: totalCount,
      storeItems: resultArr,
    });
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json({ message: "Error during fetching store items" });
  }
});

router.post("/store/addItem", upload.single("image"), async (req, res) => {
  try {
    // First, upload the image to ImgBB
    if (req.file) {
      const imgBBResponse = await axios({
        method: "post",
        url: "https://api.imgbb.com/1/upload",
        headers: {
          "Content-Type": "multipart/form-data",
        },
        data: {
          key: "b587d0ad1713024b7a6ba6763d9a62b9",
          image: req.file.buffer.toString("base64"),
        },
      });

      // Get the URL of the uploaded image
      const imageUrl = imgBBResponse.data.data.url;

      // Now create the store item with the image URL
      const storeItem = new Store({
        regID: req.body.regID,
        title: req.body.title,
        price: req.body.price,
        // contact: req.body.contact,
        location: req.body.location,
        quantity: req.body.quantity,
        showPhoneNumber: req.body.showPhoneNumber,
        image: imageUrl,
      });

      const store = await storeItem.save();

      if (!store) {
        res.status(404).json("Failed to Insert The Item to the Store");
      } else {
        res.json("Added successfully");
      }
    } else {
      res.status(400).json("No image file provided");
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

router.post(
  "/store/update/:storeItemID",
  upload.single("image"),
  async (req, res) => {
    try {
      let storeItemID = req.params.storeItemID;
      const update = {};

      ["title", "price", "location", "quantity", "showPhoneNumber"].forEach(
        (field) => {
          if (req.body[field]) update[field] = req.body[field];
        }
      );

      if (req.file) {
        const imgBBResponse = await axios({
          method: "post",
          url: "https://api.imgbb.com/1/upload",
          data: {
            key: "b587d0ad1713024b7a6ba6763d9a62b9",
            image: req.file.buffer.toString("base64"),
          },
        });

        update.imageUrl = imgBBResponse.data.data.url; // Save the ImgBB image URL instead
      }

      const updatedStoreItem = await Store.findByIdAndUpdate(
        storeItemID,
        update,
        { new: true }
      );
      if (!updatedStoreItem) {
        return res.status(404).json({ message: "Store Item Not Found" });
      }
      res.status(200).json("Item updated successfully");
    } catch (error) {
      console.error("Error during updating the store item:", error);
      res.status(500).json({ message: "Error during updating the store item" });
    }
  }
);
module.exports = router;
