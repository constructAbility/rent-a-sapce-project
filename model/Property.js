const mongoose = require("mongoose");
const propertySchema = new mongoose.Schema({
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  type: { type: String, required: true },         
  size: { type: String, required: true },        
  purpose: { type: String, required: true },      
  rentPrice: { type: Number, required: true },
  contactNumber: { type: String, required: true },
  location: { type: String, required: true },
  pinCode: { type: String, required: true },
  photos: [{ type: String }],                      


  addressProof: {
    url: { type: String },                        
    fileType: { type: String, enum: ["image", "pdf"] }
  }
}, { timestamps: true });

module.exports = mongoose.model("Property", propertySchema);
