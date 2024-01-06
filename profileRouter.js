const { Student, Professor, Admin } = require("./loginRouter");
const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/profileInfo", async (req, res) => {
  const { regID } = req.body;
  try {
    const student = await Student.findOne({ regID });
    if (!student) {
      const professor = await Professor.findOne({ regID });

      if (!professor) {
        const admin = await Admin.findOne({ ID: regID });

        if (!admin) {
          return res.json([]);
        } else {
          res.json({
            ID: admin.ID,
            name: admin.name,
            email: admin.email,
            profileImage: admin.profileImage,
          });
        }
      } else {
        res.json({
          regID: professor.regID,
          name: professor.name,
          email: professor.email,
          profileImage: professor.profileImage,
        });
      }
    } else {
      const peer = await Student.findOne({ regID: student.peerID });
      const supervisor = await Professor.findOne({
        regID: student.supervisorID,
      });

      if (!supervisor) {
        res.json({
          regID: student.regID,
          name: student.name,
          email: student.email,
          profileImage: student.profileImage,
          GPA: student.GPA,
          peer: "",
          supervisor: "",
          phoneNumber: student.phoneNumber,
        });
        return;
      }

      if (!peer) {
        res.json({
          regID: student.regID,
          name: student.name,
          email: student.email,
          profileImage: student.profileImage,
          GPA: student.GPA,
          peer: "",
          supervisor: supervisor.name,
          phoneNumber: student.phoneNumber,
        });
        return;
      }

      res.json({
        regID: student.regID,
        name: student.name,
        email: student.email,
        profileImage: student.profileImage,
        GPA: student.GPA,
        peer: peer.name,
        supervisor: supervisor.name,
        phoneNumber: student.phoneNumber,
      });
    }
  } catch (error) {
    console.error("Error during fetching profile info:", error);
    res.status(500).json({ message: "Error during fetching profile info" });
  }
});

router.put(
  "/profileInfo/editProfileImage",
  upload.single("image"),
  async (req, res) => {
    const { regID } = req.body;
    try {
      const student = await Student.findOne({ regID });
      if (!student) {
        const professor = await Professor.findOne({ regID });

        if (!professor) {
          const admin = await Admin.findOne({ ID: regID });

          // if (!admin) {
          //   return res.json([]);
          // } else {
          //   res.json({
          //     ID: admin.ID,
          //     name: admin.name,
          //     email: admin.email,
          //     image: admin.image,
          //   });
          // }
        } else {
          if (req.file) {
            const imageURL = await convertImageToURL(req.file);
            await Professor.updateOne(
              { regID: regID },
              { $set: { profileImage: imageURL } }
            );
          }
        }
      } else {
        if (req.file) {
          const imageURL = await convertImageToURL(req.file);
          await Student.updateOne(
            { regID },
            { $set: { profileImage: imageURL } }
          );
        }
      }
      return res.json("");
    } catch (error) {
      console.error("Error during fetching profile info:", error);
      res.status(500).json({ message: "Error during fetching profile info" });
    }
  }
);

router.put("/profileInfo/removeProfileImage", async (req, res) => {
  const { regID } = req.body;
  try {
    const student = await Student.findOne({ regID });
    if (!student) {
      const professor = await Professor.findOne({ regID });

      if (!professor) {
        const admin = await Admin.findOne({ ID: regID });

        // if (!admin) {
        //   return res.json([]);
        // } else {
        //   res.json({
        //     ID: admin.ID,
        //     name: admin.name,
        //     email: admin.email,
        //     image: admin.image,
        //   });
        // }
      } else {
        await Professor.updateOne(
          { regID: regID },
          { $unset: { profileImage: 1 } }
        );
      }
    } else {
      await Student.updateOne({ regID }, { $unset: { profileImage: 1 } });
    }

    return res.json("");
  } catch (error) {
    console.error("Error during fetching profile info:", error);
    res.status(500).json({ message: "Error during fetching profile info" });
  }
});

async function convertImageToURL(image) {
  const imgBBResponse = await axios({
    method: "post",
    url: "https://api.imgbb.com/1/upload",
    headers: {
      "Content-Type": "multipart/form-data",
    },
    data: {
      key: "b587d0ad1713024b7a6ba6763d9a62b9",
      image: image.buffer.toString("base64"),
    },
  });

  // Get the URL of the uploaded image
  const imageUrl = imgBBResponse.data.data.url;

  return imageUrl;
}

module.exports = router;
