const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 3001;
app.use(cors());

mongoose.connect("mongodb://127.0.0.1:27017/GradPro", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "MongoDB connection error:"));
db.once("open", () => {
  console.log("Connected to MongoDB");
});

app.use(bodyParser.json());
app.use(bodyParser.urlencoded());

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});

const { loginRoutes } = require("./loginRouter");
const coursesRoutes = require("./coursesRouter");
const storeRoutes = require("./storeRouter");
const previousProjectsRoutes = require("./previousProjectsRouter");

app.use(loginRoutes);
app.use(coursesRoutes);
app.use(storeRoutes);
app.use(previousProjectsRoutes);
