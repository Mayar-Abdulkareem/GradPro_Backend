const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");
const { Student } = require("./loginRouter");

const boardSchema = new mongoose.Schema({
  courseID: String,
  columns: Array,
  regID: String,
  supervisorID: String,
});

// const boardSchema = new mongoose.Schema({
//   courseID: String,
//   columns: Array,
//   tasks: Array,
//   collaborators: Object,
// });

const Board = mongoose.model("Board", boardSchema);

// Mayar

router.post("/boards/getBoard", async (req, res) => {
  try {
    // const courseID = req.params.courseID;
    // const regID = req.params.regID;
    const { regID, courseID, supervisorID } = req.body;

    let board = await Board.findOne({
      regID: regID,
      courseID: courseID,
    });
    if (!board) {
      board = new Board({
        courseID: courseID,
        columns: [], // Initialize columns as an empty array
        regID: regID,
        supervisorID: supervisorID,
      });

      // Save the new board to the database
      await board.save();

      // Send the newly created board back to the client
      res.status(201).json(board);
    } else {
      res.json(board);
    }
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json({ message: "Error during fetching store items" });
  }
});

router.use(express.json());

router.put("/boards/saveBoard", async (req, res) => {
  try {
    console.log("Received request to save board:", req.body); // Log the incoming request body

    const { regID, courseID, columns, tasks, supervisorID } = req.body;

    // Log the parsed values
    console.log("Parsed Request Body - regID:", regID);
    console.log("Parsed Request Body - courseID:", courseID);
    console.log("Parsed Request Body - columns:", columns);
    console.log("Parsed Request Body - tasks:", tasks);
    console.log("Parsed Request Body - supervisorID:", supervisorID);

    const query = { regID, courseID };
    const update = { regID, courseID, columns, tasks, supervisorID };

    console.log("Attempting to update board with query:", query); // Log the query
    console.log("Attempting to update board with update data:", update); // Log the update data

    const response = await Board.findOneAndUpdate(query, update, {
      new: true,
      upsert: true,
      runValidators: true,
      setDefaultsOnInsert: true,
    });

    console.log("Update operation response:", response); // Log the response from the database operation

    if (response) {
      res.json("Board updated successfully");
      console.log("Board updated successfully for:", query); // Log successful update
    } else {
      res.status(404).json("Board not found and failed to create");
      console.log("Failed to find or create board for:", query); // Log failure details
    }
  } catch (error) {
    console.error("Error during board update/create:", error); // Log any caught errors
    res.status(500).json("Error during board update/create");
  }
});

// Mayar
router.get("/boards/:courseID/:studentID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const studentID = req.params.studentID;
    const board = await Board.find({
      "collaborators.studentID": studentID,
      courseID: courseID,
    });
    if (!board) {
      res.status(404).json("No Elements in the store");
    } else {
      res.json(board);
    }
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json({ message: "Error during fetching store items" });
  }
});

router.delete("/boards/task/:studentID/:courseID/:taskID", async (req, res) => {
  try {
    const studentID = req.params.studentID;
    const courseID = req.params.courseID;
    const taskID = req.params.taskID.toString();
    const board = await Board.findOne({
      "collaborators.studentID": studentID,
      courseID: courseID,
    });
    if (board) {
      const taskIndex = board.tasks.findIndex((task) => task.id === taskID);
      if (taskIndex !== -1) {
        board.tasks.splice(taskIndex, 1);
        const response = await Board.findByIdAndUpdate(
          board._id,
          { tasks: board.tasks },
          {
            new: true,
            runValidators: true,
          }
        );
        return res.json(response);
      } else {
        return res.status(404).json("Task not found");
      }
    } else {
      return res.status(404).json("Board not found");
    }
  } catch (error) {
    console.error("Error during fetching store items:", error);
    res.status(500).json("Error during fetching store items");
  }
});

router.delete(
  "/boards/column/:studentID/:courseID/:columnID",
  async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;
      const board = await Board.findOne({
        "collaborators.studentID": studentID,
        courseID: courseID,
      });
      if (board) {
        const columnIndex = board.columns.findIndex(
          (column) => column.id === columnID
        );

        if (columnIndex !== -1) {
          board.columns.splice(columnIndex, 1);
          board.tasks = board.tasks.filter((task) => {
            return task.columnId != columnID;
          });
          const response = await Board.findByIdAndUpdate(
            board._id,
            { columns: board.columns, tasks: board.tasks },
            {
              new: true,
              runValidators: true,
            }
          );
          return res.json(response);
        } else {
          return res
            .status(404)
            .json("Column not found in the specified board");
        }
      } else {
        return res.status(404).json("Board not found");
      }
    } catch (error) {
      console.error("Error during fetching store items:", error);
      res.status(500).json("Error during fetching store items");
    }
  }
);

router.post(
  "/boards/addTask/:studentID/:courseID/:columnID",
  async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;
      const result = await Board.updateOne(
        {
          "collaborators.studentID": studentID,
          courseID: courseID,
        },
        {
          $push: {
            tasks: {
              id: req.body.id.toString(),
              columnId: columnID,
              title: req.body.content,
              describtion: "",
            },
          },
        }
      );

      if (!result) {
        res.status(404).json("Failed to add task to the board");
      } else {
        res.json(result);
      }
    } catch (error) {
      console.error("Error during adding task to the board:", error);
      res
        .status(500)
        .json({ message: "Error during adding task to the board" });
    }
  }
);

router.post("/boards/addColumn", async (req, res) => {
  try {
    const studentID = req.body.studentID;
    const courseID = req.body.courseID;
    const student = await Student.findOne({ regID: studentID });
    const result = await Board.updateOne(
      {
        "collaborators.studentID": studentID,
        "collaborators.supervisorID": student.supervisorID,
        courseID: courseID,
      },
      {
        $addToSet: {
          columns: {
            id: req.body.id.toString(),
            title: req.body.content,
          },
        },
      },
      { upsert: true, new: true }
    );

    if (!result) {
      res.status(404).json("Failed to add task to the board");
    } else {
      res.json(result);
    }
  } catch (error) {
    console.error("Error during adding task to the board:", error);
    res.status(500).json({ message: "Error during adding task to the board" });
  }
});

router.put(
  "/boards/editTask/:studentID/:courseID/:taskID",
  async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const courseID = req.params.courseID;
      const taskID = req.params.taskID;
      const title = req.body.title;
      const describtion = req.body.describtion;

      const board = await Board.findOne({
        "collaborators.studentID": studentID,
        courseID: courseID,
        "tasks.id": taskID,
      });
      if (board) {
        const taskIndex = board.tasks.findIndex((task) => task.id === taskID);
        if (taskIndex !== -1) {
          board.tasks[taskIndex].title = title;
          board.tasks[taskIndex].describtion = describtion;
          const response = await Board.findByIdAndUpdate(
            board._id,
            { tasks: board.tasks },
            {
              new: true,
              runValidators: true,
            }
          );
          return res.json(response);
        } else {
          return res.status(404).json("Task not found in the specified column");
        }
      } else {
        return res.status(404).json("Board not found");
      }
    } catch (error) {
      console.error("Error during editing the task:", error);
      res.status(500).json("Error during editing the task");
    }
  }
);

router.put(
  "/boards/editColumnTitle/:studentID/:courseID/:columnID",
  async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;

      const board = await Board.findOne({
        "collaborators.studentID": studentID,
        courseID: courseID,
        "columns.id": columnID,
      });
      if (board) {
        const columnIndex = board.columns.findIndex(
          (column) => column.id === columnID
        );

        if (columnIndex !== -1) {
          board.columns[columnIndex].title = req.body.title;
          const response = await Board.findByIdAndUpdate(
            board._id,
            { columns: board.columns },
            {
              new: true,
              runValidators: true,
            }
          );
          return res.json(response);
        } else {
          return res
            .status(404)
            .json("Column not found in the specified board");
        }
      } else {
        return res.status(404).json("Board not found");
      }
    } catch (error) {
      console.error("Error during fetching store items:", error);
      res.status(500).json("Error during fetching store items");
    }
  }
);

router.put(
  "/boards/editBoarderOrder/:studentID/:courseID",
  async (req, res) => {
    try {
      const studentID = req.params.studentID;
      const courseID = req.params.courseID;

      const board = await Board.findOne({
        "collaborators.studentID": studentID,
        courseID: courseID,
      });
      if (board) {
        const response = await Board.findByIdAndUpdate(
          board._id,
          { columns: req.body.columns, tasks: req.body.tasks },
          {
            new: true,
            runValidators: true,
          }
        );
        return res.json("Board updated successfully");
      } else {
        return res.status(404).json("Board not found");
      }
    } catch (error) {
      console.error("Error during fetching store items:", error);
      res.status(500).json("Error during fetching store items");
    }
  }
);

module.exports = router;
