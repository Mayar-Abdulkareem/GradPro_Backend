const jwt = require("jsonwebtoken");
require("dotenv").config();
const secretKey = process.env.JWT_SECRET;

function authenticateMiddleware(req, res, next) {
  const token = req.headers.authorization;

  jwt.verify(token, secretKey, (err, decoded) => {
    if (err) {
      return res.json("login");
    }
    console.log("valid");
    next();
  });
}

module.exports = authenticateMiddleware;
