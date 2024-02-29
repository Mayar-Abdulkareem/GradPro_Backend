const { Student, Professor, Admin } = require("./loginRouter");
const { Course } = require("./coursesRouter");
const { Configuration } = require("./configurationsRouter")

const express = require("express");
const router = express.Router();
const multer = require("multer");
const axios = require("axios");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

router.post("/profileInfo", async (req, res) => {
  const { regID, role } = req.body;
  try {
    if (role === "supervisor") {
      const professor = await Professor.findOne({ regID });
      if (!professor) {
        return res.json(nullObject("professor"));
      } else {
        console.log({
          regID: professor.regID,
          name: professor.name,
          email: professor.email,
          profileImage: professor.profileImage,
          courseStudents: professor.courseStudents
        })
        res.json({
          regID: professor.regID,
          name: professor.name,
          email: professor.email,
          profileImage: professor.profileImage,
          courseStudents: professor.courseStudents
        });
      }
    } else if (role === "admin") {
      const admin = await Admin.findOne({ ID: regID });
      if (!admin) {
        return res.json(nullObject("admin"));
      } else {
        res.json(admin);
      }
    } else if (role === "student") {
      const student = await Student.findOne({ regID });
      if (!student) {
        return res.json(nullObject("student"));
      }

      let registeredCourses = [];

      student.courses.forEach((course) => {
        if (course.status === "registered") {
          registeredCourses.push({
            courseID: course.courseID,
            supervisorID: course.supervisorID,
          });
        }
      });

      await Promise.all(
        registeredCourses.map(async (registeredCourse, index) => {
          const course = await Course.findOne({
            courseID: registeredCourse.courseID,
          });
          const professor = await Professor.findOne({
            regID: registeredCourse.supervisorID,
          });
          return (registeredCourses[index] = {
            ...registeredCourse,
            courseName: course.courseName,
            supervisorName: professor.name,
          });
        })
      );

      const peer = student.peerID
        ? await Student.findOne({ regID: student.peerID })
        : null;
      const supervisor = student.supervisorID
        ? await Professor.findOne({ regID: student.supervisorID })
        : null;

        const response = await axios.get('http://127.0.0.1:3001/configuration/checkDeadlines');


        const { registrationFinished, peerRegistrationFinished } = response.data;

      res.json({
        regID: student.regID,
        name: student.name,
        email: student.email,
        profileImage: student.profileImage,
        GPA: student.GPA,
        phoneNumber: student.phoneNumber,
        peer: peer ? peer.name : null,
        supervisor: supervisor ? supervisor.name : null,
        skillsVector: student.skillsVector,
        courses: registeredCourses,
        registrationFinished, 
        peerRegistrationFinished 
      });
    }
  } catch (error) {
    console.error("Error during fetching profile info:", error);
    res.status(500).json({ message: "Error during fetching profile info" });
  }
});

function nullObject(entityType) {
  let baseNullObject = {
    ID: null,
    name: null,
    email: null,
    profileImage: null,
  };

  if (entityType === "student") {
    return {
      ...baseNullObject,
      GPA: null,
      phoneNumber: null,
      peer: null,
      skillsVector: null,
      courses: [],
    };
  }
  return baseNullObject;
}

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
