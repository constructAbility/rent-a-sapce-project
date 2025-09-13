require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const helmet = require("helmet");


const authRoutes = require("./route/auth");

const ownerRoutes = require("./route/owner");


const app = express();
app.use(cors());
app.use(express.json());
app.use(helmet());

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => console.log(err));

app.use("/api/auth", authRoutes);
app.use("/api/owner", ownerRoutes);

app.listen(5000, () => console.log("Server running on 5000"));
