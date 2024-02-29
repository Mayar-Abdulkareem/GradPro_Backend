const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });
const { Tag } = require("./tagsRouter");
const { Assignment, Submission } = require("./assignmentsRouter");
const { Request } = require("./requestsRouter");
const { Board } = require("./projectBoardRouter");
const { Course } = require("./coursesRouter");
const { Project } = require("./previousProjectsRouter");
const { Student, Professor } = require("./loginRouter");
const axios = require("axios");

const configurationSchema = new mongoose.Schema({
  studentsMax: String,
  registerationStart: { type: Date, default: Date.now },
  registerationEnd: { type: Date, default: Date.now },
  peerSelectionStart: { type: Date, default: Date.now },
  peerSelectionEnd: { type: Date, default: Date.now },
});

const Configuration = mongoose.model("Configuration", configurationSchema);

router.get('/configuration/checkDeadlines', async (req, res) => {
  try {
      const config = await Configuration.findOne().sort({ _id: -1 }).limit(1);

      if (!config) {
          console.log("No configuration found");
          return res.status(404).json({ message: "Configuration not found" });
      }

      const now = new Date();

      const registrationEndDate = new Date(config.registerationEnd);
      const peerSelectionEndDate = new Date(config.peerSelectionEnd);

      const registrationFinished = now > registrationEndDate;
      const peerRegistrationFinished = now > peerSelectionEndDate;

      res.json({
          registrationFinished,
          peerRegistrationFinished
      });
  } catch (error) {
      console.error("Error fetching configuration:", error);
      res.status(500).json({ message: "Server error" });
  }
});



router.get("/configurations", async (req, res) => {
  try {
    const result = await Configuration.find({});
    return res.json(result[0]);
  } catch (error) {
    console.error("Error during fetching configurations:", error);
    res.status(500).json({ message: "Error during fetching configurations" });
  }
});

router.post("/configurations/edit", async (req, res) => {
  try {
    const update = {};

    [
      "studentsMax",
      "registerationStart",
      "registerationEnd",
      "peerSelectionStart",
      "peerSelectionEnd",
    ].forEach((field) => {
      if (req.body[field]) update[field] = req.body[field];
    });

    const conf = await Configuration.findOne({});
    if (!conf) {
      const newDoc = new Configuration({
        update,
      });
      await newDoc.save();
    } else {
      await Configuration.findByIdAndUpdate(
        conf._id,
        { $set: update },
        { upsert: true }
      );
    }
    return res.json("Configurations Updated Successfully");
  } catch (error) {
    console.error("Error during setting Configurations:", error);
    res.status(500).json({ message: "Error during setting Configurations" });
  }
});

router.post("/addStudentSkills", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const fileContent = req.file.buffer.toString("utf-8");
      const desiredFields = ["title", "skills", "courseID"];
      if (req.file.originalname.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);
        if (
          Array.isArray(jsonData)
            ? !jsonData.every((element) =>
                haveDesiredFormat(element, desiredFields, true)
              )
            : !haveDesiredFormat(jsonData, desiredFields, true)
        ) {
          return res.json("The file doesn't contain the required fields");
        }
        let formattedData;
        if (Array.isArray(jsonData)) {
          formattedData = jsonData.map((data) => {
            return {
              category: data.title,
              skills: data.skills,
              courseID: data.courseID || null,
            };
          });
        } else {
          formattedData = [
            {
              category: jsonData.title,
              skills: jsonData.skills,
              courseID: jsonData.courseID || null,
            },
          ];
        }

        const updatedDocument = await Tag.findOneAndReplace(
          { for: "student" },
          { for: "student", categories: formattedData },
          { new: true, upsert: true }
        );

        return res.json("Skills/s added successfully");
      } else {
        return res.json("file format not supported");
      }
    }
    return res.json("no file uploaded");
  } catch (error) {
    console.error("Error during adding skills/s:", error);
    res.status(500).json({ message: "Error during adding skills/s" });
  }
});

router.post("/importGrades", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const fileContent = req.file.buffer.toString("utf-8");
      const desiredFields = ["regID", "passed"];
      if (req.file.originalname.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);
        if (
          Array.isArray(jsonData)
            ? !jsonData.every((element) =>
                haveDesiredFormat(element, desiredFields)
              )
            : !haveDesiredFormat(jsonData, desiredFields)
        ) {
          return res.json("The file doesn't contain the required fields");
        }

        if (Array.isArray(jsonData)) {
          await Promise.all(
            jsonData.map(async (jsonElement) => {
              if (jsonElement.passed.toLowerCase() === "true") {
                const response = await axios.post(
                  "http://127.0.0.1:3001/courses/passedCourse",
                  {
                    id: jsonElement.regID,
                  }
                );
              } else if (jsonElement.passed.toLowerCase() === "false") {
                const response = await axios.post(
                  "http://127.0.0.1:3001/courses/failedCourse",
                  {
                    id: jsonElement.regID,
                  }
                );
              }
            })
          );
        } else {
          if (jsonData.passed.toLowerCase() === "true") {
            const response = await axios.post(
              "http://127.0.0.1:3001/courses/passedCourse",
              {
                id: jsonData.regID,
              }
            );
          } else if (jsonData.passed.toLowerCase() === "false") {
            const response = await axios.post(
              "http://127.0.0.1:3001/courses/failedCourse",
              {
                id: jsonData.regID,
              }
            );
          }
        }
        return res.json("Grades added successfully");
      } else if (req.file.originalname.endsWith(".csv")) {
        const jsonData = [];
        const keys = fileContent.split("\n")[0].slice(0, -1).split(",");
        fileContent.split("\n").forEach((line, index) => {
          if (index === 0 || index === fileContent.split("\n").length - 1)
            return; // Skip header line
          const fields = line.split(",");
          const student = {};
          for (let i = 0; i < keys.length; i++) {
            const keyVal = keys[i];
            const value = (fields[i] && fields[i].trim()) || "";
            student[keyVal] = value;
          }
          jsonData.push(student);
        });
        if (
          !jsonData.every((element) =>
            haveDesiredFormat(element, desiredFields)
          )
        ) {
          return res.json("The file doesn't contain the required fields");
        }
        await Promise.all(
          jsonData.map(async (jsonElement) => {
            if (jsonElement.passed.toLowerCase() === "true") {
              const response = await axios.post(
                "http://127.0.0.1:3001/requests/acceptCourseRegisterationRequest",
                {
                  id: jsonElement.regID,
                }
              );
            } else if (jsonElement.passed.toLowerCase() === "false") {
              const response = await axios.post(
                "http://127.0.0.1:3001/requests/denyCourseRegisterationRequest",
                {
                  id: jsonElement.regID,
                }
              );
            }
          })
        );
        return res.json("Grades added successfully");
      } else {
        return res.json("file format not supported");
      }
    }

    return res.json("No File Provided");
  } catch (error) {
    console.error("Error during resetting semester:", error);
    res.status(500).json({ message: "Error during resetting semester" });
  }
});

router.get("/resetSemester", async (req, res) => {
  try {
    // delete all assignmnets
    await Assignment.deleteMany({});

    // delete all submissions
    await Submission.deleteMany({});

    // delete all submissions
    await Request.deleteMany({});

    // delete all submissions
    await Board.deleteMany({});

    // delete supervisorID and peerID of the all students
    await Student.updateMany({}, { $unset: { supervisorID: 1, peerID: 1 } });

    // delete all professors students
    await Professor.updateMany({}, { $set: { courseStudents: [] } });

    return res.json("Semester Reset Successfully");
  } catch (error) {
    console.error("Error during resetting semester:", error);
    res.status(500).json({ message: "Error during resetting semester" });
  }
});

router.post("/importProjects", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const fileContent = req.file.buffer.toString("utf-8");
      const desiredFields = [
        "firstStudentID",
        "secondStudentID",
        "supervisorID",
        "courseID",
        "projectName",
      ];
      if (req.file.originalname.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);
        console.log(jsonData);
        if (
          Array.isArray(jsonData)
            ? !jsonData.every((element) =>
                haveDesiredFormat(element, desiredFields)
              )
            : !haveDesiredFormat(jsonData, desiredFields)
        ) {
          return res.json("The file doesn't contain the required fields");
        }

        if (Array.isArray(jsonData)) {
          await Promise.all(
            jsonData.map(async (jsonElement) => {
              const firstStudent = await Student.findOne({
                regID: jsonElement.firstStudentID,
              });
              const secondStudent = await Student.findOne({
                regID: jsonElement.secondStudentID,
              });

              const supervisor = await Professor.findOne({
                regID: jsonElement.supervisorID,
              });

              const course = await Course.findOne({
                courseID: jsonElement.courseID,
              });

              const newData = new Project({
                students: [
                  { id: firstStudent.regID, name: firstStudent.name },
                  secondStudent
                    ? { id: secondStudent.regID, name: secondStudent.name }
                    : null,
                ].filter(Boolean),
                supervisor: {
                  id: supervisor.regID,
                  name: supervisor.name,
                },
                projectType: {
                  id: course.courseID,
                  name: course.courseName,
                },
                name: jsonElement.projectName,
              });

              await newData.save();
            })
          );
        } else {
          const firstStudent = await Student.findOne({
            regID: jsonData.firstStudentID,
          });
          const secondStudent = await Student.findOne({
            regID: jsonData.secondStudentID,
          });

          const supervisor = await Professor.findOne({
            regID: jsonData.supervisorID,
          });

          const course = await Course.findOne({
            courseID: jsonData.courseID,
          });

          const newData = new Project({
            students: [
              { id: firstStudent.regID, name: firstStudent.name },
              secondStudent
                ? { id: secondStudent.regID, name: secondStudent.name }
                : null,
            ].filter(Boolean),
            supervisor: {
              id: supervisor.regID,
              name: supervisor.name,
            },
            projectType: {
              id: course.courseID,
              name: course.courseName,
            },
            name: jsonData.projectName,
          });

          await newData.save();
        }
        return res.json("Projects added successfully");
      } else if (req.file.originalname.endsWith(".csv")) {
        const jsonData = [];
        const keys = fileContent.split("\n")[0].slice(0, -1).split(",");
        fileContent.split("\n").forEach((line, index) => {
          if (index === 0 || index === fileContent.split("\n").length - 1)
            return; // Skip header line
          const fields = line.split(",");
          const student = {};
          for (let i = 0; i < keys.length; i++) {
            const keyVal = keys[i];
            const value = (fields[i] && fields[i].trim()) || "";
            student[keyVal] = value;
          }
          jsonData.push(student);
        });
        if (
          !jsonData.every((element) =>
            haveDesiredFormat(element, desiredFields)
          )
        ) {
          return res.json("The file doesn't contain the required fields");
        }
        await Promise.all(
          jsonData.map(async (jsonElement) => {
            const firstStudent = await Student.findOne({
              regID: jsonElement.firstStudentID,
            });
            const secondStudent = await Student.findOne({
              regID: jsonElement.secondStudentID,
            });

            const supervisor = await Professor.findOne({
              regID: jsonElement.supervisorID,
            });

            const course = await Course.findOne({
              courseID: jsonElement.courseID,
            });

            const newData = new Project({
              students: [
                { id: firstStudent.regID, name: firstStudent.name },
                secondStudent
                  ? { id: secondStudent.regID, name: secondStudent.name }
                  : null,
              ].filter(Boolean),
              supervisor: {
                id: supervisor.regID,
                name: supervisor.name,
              },
              projectType: {
                id: course.courseID,
                name: course.courseName,
              },
              name: jsonElement.projectName,
            });

            await newData.save();
          })
        );
        return res.json("Projects added successfully");
      } else {
        return res.json("file format not supported");
      }
    }

    return res.json("No File Provided");
  } catch (error) {
    console.error("Error during adding projects:", error);
    res.status(500).json({ message: "Error during adding projects" });
  }
});

router.post("/importProjectsLinks", upload.single("file"), async (req, res) => {
  try {
    if (req.file) {
      const fileContent = req.file.buffer.toString("utf-8");
      const desiredFields = [
        "firstStudentID",
        "secondStudentID",
        "supervisorID",
        "courseID",
        "link",
      ];
      if (req.file.originalname.endsWith(".json")) {
        const jsonData = JSON.parse(fileContent);
        console.log(jsonData);
        if (
          Array.isArray(jsonData)
            ? !jsonData.every((element) =>
                haveDesiredFormat(element, desiredFields)
              )
            : !haveDesiredFormat(jsonData, desiredFields)
        ) {
          return res.json("The file doesn't contain the required fields");
        }

        if (Array.isArray(jsonData)) {
          await Promise.all(
            jsonData.map(async (jsonElement) => {
              await Project.findOneAndUpdate(
                {
                  $and: [
                    { "projectType.id": jsonElement.courseID },
                    { "supervisor.id": jsonElement.supervisorID },
                    {
                      "students.id": {
                        $all: [
                          jsonElement.firstStudentID,
                          jsonElement.secondStudentID
                            ? jsonElement.secondStudentID
                            : null,
                        ].filter(Boolean),
                      },
                    },
                  ],
                },
                { $set: { link: jsonElement.link } },
                { new: true, upsert: true }
              );
            })
          );
        } else {
          await Project.findOneAndUpdate(
            {
              $and: [
                { "projectType.id": jsonData.courseID },
                { "supervisor.id": jsonData.supervisorID },
                {
                  "students.id": {
                    $all: [
                      jsonData.firstStudentID,
                      jsonData.secondStudentID
                        ? jsonData.secondStudentID
                        : null,
                    ].filter(Boolean),
                  },
                },
              ],
            },
            { $set: { link: jsonData.link } },
            { new: true, upsert: true }
          );
        }
        return res.json("Projects Links added successfully");
      } else if (req.file.originalname.endsWith(".csv")) {
        const jsonData = [];
        const keys = fileContent.split("\n")[0].slice(0, -1).split(",");
        fileContent.split("\n").forEach((line, index) => {
          if (index === 0 || index === fileContent.split("\n").length - 1)
            return; // Skip header line
          const fields = line.split(",");
          const student = {};
          for (let i = 0; i < keys.length; i++) {
            const keyVal = keys[i];
            const value = (fields[i] && fields[i].trim()) || "";
            student[keyVal] = value;
          }
          jsonData.push(student);
        });
        if (
          !jsonData.every((element) =>
            haveDesiredFormat(element, desiredFields)
          )
        ) {
          return res.json("The file doesn't contain the required fields");
        }
        await Promise.all(
          jsonData.map(async (jsonElement) => {
            await Project.findOneAndUpdate(
              {
                $and: [
                  { "projectType.id": jsonElement.courseID },
                  { "supervisor.id": jsonElement.supervisorID },
                  {
                    "students.id": {
                      $all: [
                        jsonElement.firstStudentID,
                        jsonElement.secondStudentID
                          ? jsonElement.secondStudentID
                          : null,
                      ].filter(Boolean),
                    },
                  },
                ],
              },
              { $set: { link: jsonElement.link } },
              { new: true, upsert: true }
            );
          })
        );
        return res.json("Projects Links added successfully");
      } else {
        return res.json("file format not supported");
      }
    }

    return res.json("No File Provided");
  } catch (error) {
    console.error("Error during adding projects:", error);
    res.status(500).json({ message: "Error during adding projects" });
  }
});

function haveDesiredFormat(fileData, expectedFields, skills = false) {
  const actualFields = Object.keys(fileData);

  // Check if all expected fields are present in the actual fields
  const allExpectedFieldsPresent = expectedFields.every((field) =>
    actualFields.includes(field)
  );

  // Check if all actual fields are present in the expected fields
  const noExtraFields = actualFields.every((field) =>
    expectedFields.includes(field)
  );
  if (skills) {
    let skillsIsArray = false;
    if (allExpectedFieldsPresent && noExtraFields) {
      if (Array.isArray(fileData["skills"])) {
        skillsIsArray = true;
      }
    }

    return allExpectedFieldsPresent && noExtraFields && skillsIsArray;
  }
  return allExpectedFieldsPresent && noExtraFields;
}

module.exports = router;
