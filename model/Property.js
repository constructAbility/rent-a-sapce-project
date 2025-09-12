const mongoose = require("mongoose");

const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },          // flat, land, room
  size: { type: String, required: true },          // eg. 1200 sqft
  purpose: { type: String, required: true },       // rent, sale, parking
  rentPrice: { type: Number, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  pinCode: { type: String, required: true },
  photos: [{ type: String }],                      // cloudinary URLs
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
