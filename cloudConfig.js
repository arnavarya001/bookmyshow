const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

require("dotenv").config();

let storage;

if (process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET && process.env.CLOUD_NAME !== "your_cloudinary_name") {
  cloudinary.config({
    cloud_name: process.env.CLOUD_NAME,
    api_key: process.env.CLOUD_API_KEY,
    api_secret: process.env.CLOUD_API_SECRET,
  });

  storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
      folder: "bookmyshow_DEV",
      allowed_formats: ["jpeg", "png", "jpg", "webp"],
    },
  });
} else {
  // Use memoryStorage on serverless or fallback to local disk
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME;
  if (isServerless) {
    storage = multer.memoryStorage();
  } else {
    const uploadDir = path.join(__dirname, "public/uploads");
    try {
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }
    } catch (e) {
      console.warn("Upload dir notice:", e.message);
    }

    storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, uploadDir);
      },
      filename: function (req, file, cb) {
        cb(null, Date.now() + "-" + file.originalname);
      },
    });
  }
}

module.exports = {
  cloudinary,
  storage,
};