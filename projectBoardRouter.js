const express = require("express");
const router = express.Router();
const mongoose = require("mongoose");

const boardSchema = new mongoose.Schema({
  collaborators: Array,
  columns: Array,
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
      const taskID = req.params.taskID.split(".")[1];
      const columnID = req.params.taskID.split(".")[0];
      const board = await Board.findOne({
        collaborators: collaboratorID,
        courseID: courseID,
      });
      if (board) {
        const column = board.columns.find((col) => col.columnID === columnID);
        if (column) {
          const taskIndex = column.tasks.findIndex(
            (task) => task.id === taskID
          );
          if (taskIndex !== -1) {
            column.tasks.splice(taskIndex, 1);
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
              .json("Task not found in the specified column");
          }
        } else {
          return res.status(404).json("Column not found");
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
          (column) => column.columnID === columnID
        );

        if (columnIndex !== -1) {
          board.columns.splice(columnIndex, 1);
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

router.post(
  "/boards/addTask/:collaboratorID/:courseID/:columnID",
  async (req, res) => {
    try {
      const collaboratorID = req.params.collaboratorID;
      const courseID = req.params.courseID;
      const columnID = req.params.columnID;

      Board.updateOne(
        {
          collaborators: collaboratorID,
          courseID: courseID,
          "columns.columnID": columnID,
        },
        {
          $push: {
            "columns.$.tasks": {
              id: newTaskId,
              content: req.body,
            },
          },
        }
      );

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
  }
);

module.exports = router;
