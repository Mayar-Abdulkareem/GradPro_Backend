const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  collaborators: Array,
  courseID: String,
  columns: Array,
  tasks: Array,
});

const Board = mongoose.model("Board", boardSchema);

router.get("/boards/:courseID/:collaboratorID", async (req, res) => {
  try {
    const courseID = req.params.courseID;
    const collaboratorID = req.params.collaboratorID;
    const board = await Board.find({
      collaborators: collaboratorID,
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

router.delete(
  "/boards/task/:collaboratorID/:courseID/:taskID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const taskID = req.params.taskID.toString();
      const board = await Board.findOne({
        collaborators: collaboratorID,
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
  }
);

router.delete(
  "/boards/column/:collaboratorID/:courseID/:columnID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;
      const board = await Board.findOne({
        collaborators: collaboratorID,
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
  "/boards/addTask/:collaboratorID/:courseID/:columnID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;
      const result = await Board.updateOne(
        {
          collaborators: collaboratorID,
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
    const collaborators = req.body.collaborators;
    const courseID = req.body.courseID;
    const result = await Board.updateOne(
      {
        collaborators: collaborators,
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
  "/boards/editTask/:collaboratorID/:courseID/:taskID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const taskID = req.params.taskID;
      const title = req.body.title;
      const describtion = req.body.describtion;

      const board = await Board.findOne({
        collaborators: collaboratorID,
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
  "/boards/editColumnTitle/:collaboratorID/:courseID/:columnID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;

      const board = await Board.findOne({
        collaborators: collaboratorID,
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
  "/boards/editBoarderOrder/:collaboratorID/:courseID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;

      const board = await Board.findOne({
        collaborators: collaboratorID,
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
        return res.json(response);
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
