const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();
const port = 3001;
app.use(cors());

mongoose.connect(
  "mongodb+srv://gradpro:fhfaTAi2MBNDw6dS@gradpro.nz27yys.mongodb.net/GradPro",
  {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  }
);

// mongoose.connect("mongodb://127.0.0.1:27017/GradPro", {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// });

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
const { coursesRoutes } = require("./coursesRouter");
const storeRoutes = require("./storeRouter");
const previousProjectsRoutes = require("./previousProjectsRouter");
const professorsRoutes = require("./professorsRouter");
const requestsRoutes = require("./requestsRouter");
const projectBoardRoutes = require("./projectBoardRouter");
const tagsRoutes = require("./tagsRouter");
const peerMatchingRoutes = require("./peerMatchingRouter");
const assignmentsRoutes = require("./assignmentsRouter");
const profileRoutes = require("./profileRouter");

app.get("/health", (req, res) => {
  return res.send("Healthy");
});

app.use(loginRoutes);
app.use(coursesRoutes);
app.use(storeRoutes);
app.use(previousProjectsRoutes);
app.use(professorsRoutes);
app.use(requestsRoutes);
app.use(projectBoardRoutes);
app.use(tagsRoutes);
app.use(peerMatchingRoutes);
app.use(assignmentsRoutes);
app.use(profileRoutes);
