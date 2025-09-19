const Property = require("../model/Property");
const cloudinary = require("../util/cloudinary");
const sendEmail = require("../util/sendEmail"); // email helper


exports.addProperty = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const { type, size, purpose, rentPrice, contactNumber, location, pinCode } = req.body;

    let photoUrls = [];
    if (req.files && req.files.photos) {
      for (let file of req.files.photos) {
        const uploaded = await cloudinary.uploader.upload(file.path, { folder: "properties/photos" });
        photoUrls.push(uploaded.secure_url);
      }
    }

    // 🔹 Address proof upload (optional)
    let addressProof = {};
    if (req.files && req.files.addressProof) {
      const proofFile = req.files.addressProof[0];
      const uploaded = await cloudinary.uploader.upload(proofFile.path, {
        folder: "properties/addressProof",
        resource_type: "auto" // pdf or image dono chalega
      });

      addressProof = {
        url: uploaded.secure_url,
        fileType: proofFile.mimetype.includes("pdf") ? "pdf" : "image"
      };
    }

    const newProperty = new Property({
      ownerId,
      type,
      size,
      purpose,
      rentPrice,
      contactNumber,
      location,
      pinCode,
      photos: photoUrls,
      addressProof,   // 🔹 store here
    });

    await newProperty.save();

    res.status(201).json({ message: "Property added successfully", property: newProperty });
  } catch (err) {
    res.status(500).json({ message: "Error adding property", error: err.message });
  }
};

exports.getAllPropertiesForAdmin = async (req, res) => {
  try {
    // 🔹 Admin ko sab dikhega
    const properties = await Property.find().populate("ownerId", "name email");
    res.json({ properties });
  } catch (err) {
    res.status(500).json({ message: "Error fetching properties for admin", error: err.message });
  }
};

// 🔹 Get all properties of logged-in owner
exports.getOwnerProperties = async (req, res) => {
  try {
    const ownerId = req.user.id;
    // 🔹 Exclude addressProof
    const properties = await Property.find({ ownerId }).select("-addressProof");
    res.json({ properties });
  } catch (err) {
    res.status(500).json({ message: "Error fetching properties", error: err.message });
  }
};


// 🔹 Update property by ID
exports.updateProperty = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const propertyId = req.params.id;

    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) return res.status(404).json({ message: "Property not found" });

    const updates = req.body;

    if (req.files) {
      let photoUrls = [];
      for (let file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.path, { folder: "properties" });
        photoUrls.push(uploaded.secure_url);
      }
      updates.photos = photoUrls;
    }

    const updatedProperty = await Property.findByIdAndUpdate(propertyId, updates, { new: true });

    // 🔹 Identify changed fields for email
    const changedFields = [];
    for (let key in updates) {
      if (updates[key] != property[key]) {
        changedFields.push({ field: key, old: property[key], new: updates[key] });
      }
    }

    const changesHtml = changedFields.map(f => `<li>${f.field}: ${f.old} → ${f.new}</li>`).join("");

    await sendEmail(
      req.user.email,
      "Property Updated",
      `<h3>Hello ${req.user.role}</h3>
       <p>Your property "${property.type}" has been updated. Changes:</p>
       <ul>${changesHtml}</ul>`
    );

    res.json({ message: "Property updated", property: updatedProperty });
  } catch (err) {
    res.status(500).json({ message: "Error updating property", error: err.message });
  }
};

// 🔹 Delete property by ID
exports.deleteProperty = async (req, res) => {
  try {
    const ownerId = req.user.id;
    const propertyId = req.params.id;

    const property = await Property.findOne({ _id: propertyId, ownerId });
    if (!property) return res.status(404).json({ message: "Property not found" });

    await Property.findByIdAndDelete(propertyId);

    await sendEmail(
      req.user.email,
      "Property Deleted",
      `<h3>Hello ${req.user.role}</h3>
       <p>Your property "${property.type}" has been deleted. Details were:</p>
       <ul>
         <li>Type: ${property.type}</li>
         <li>Size: ${property.size}</li>
         <li>Purpose: ${property.purpose}</li>
         <li>Rent Price: ${property.rentPrice}</li>
         <li>Contact Number: ${property.contactNumber}</li>
         <li>Location: ${property.location}</li>
         <li>Pin Code: ${property.pinCode}</li>
         <li>Photos: ${property.photos.join(", ")}</li>
       </ul>`
    );

    res.json({ message: "Property deleted successfully" });
  } catch (err) {
    res.status(500).json({ message: "Error deleting property", error: err.message });
  }
};
