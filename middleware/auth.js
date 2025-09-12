const jwt = require("jsonwebtoken");

const authMiddleware = (req, res, next) => {
  try {
    // Token should be sent in header as "Authorization: Bearer <token>"
    const authHeader = req.headers["authorization"];
    if (!authHeader) return res.status(401).json({ message: "No token provided" });

    const token = authHeader.split(" ")[1]; // "Bearer <token>"
    if (!token) return res.status(401).json({ message: "Invalid token format" });

    // Verify token
    const decoded = jwt.verify(token, "SECRET_KEY"); // same secret as login
    req.user = decoded; // store decoded info in req.user

    next(); // allow access to route
  } catch (err) {
    return res.status(401).json({ message: "Unauthorized or token expired", error: err.message });
  }
};

module.exports = authMiddleware;
