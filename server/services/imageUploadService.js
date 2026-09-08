import multer from "multer";
import path from "path";
import fs from "fs";
import { v2 as cloudinary } from "cloudinary";

/* =========================================
   STORAGE CONFIGURATION
========================================= */

// Ensure local uploads directory exists
const UPLOADS_DIR = path.resolve("uploads", "menu");
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

// Configure Cloudinary if environment variables are set
const isCloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

// Allowed MIME types & extensions
const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

// Multer memory storage (allows buffer streaming to Cloudinary or disk)
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype) || !ALLOWED_EXTENSIONS.includes(ext)) {
    return cb(
      new Error(
        "Invalid file type. Only JPG, JPEG, PNG, and WEBP image formats are permitted."
      ),
      false
    );
  }

  cb(null, true);
};

export const uploadMiddleware = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
}).single("image");

/* =========================================
   UPLOAD SERVICE METHOD
========================================= */

export const processImageUpload = async (file, hostUrl = "") => {
  if (!file) {
    throw new Error("No image file provided.");
  }

  // 1. If Cloudinary is configured, stream to Cloudinary
  if (isCloudinaryConfigured) {
    return new Promise((resolve, reject) => {
      const uploadStream = cloudinary.uploader.upload_stream(
        {
          folder: "tastybites/menu",
          transformation: [
            { width: 800, height: 800, crop: "limit", quality: "auto", fetch_format: "auto" },
          ],
        },
        (error, result) => {
          if (error) {
            console.error("Cloudinary upload error:", error);
            return reject(new Error("Image upload to Cloudinary failed."));
          }
          resolve({
            url: result.secure_url,
            publicId: result.public_id,
            storage: "cloudinary",
          });
        }
      );

      uploadStream.end(file.buffer);
    });
  }

  // 2. Fallback: Save to local filesystem
  const ext = path.extname(file.originalname).toLowerCase();
  const safeName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}${ext}`;
  const targetPath = path.join(UPLOADS_DIR, safeName);

  await fs.promises.writeFile(targetPath, file.buffer);

  // Return full public URL or relative path
  const relativeUrl = `/uploads/menu/${safeName}`;
  const fullUrl = hostUrl ? `${hostUrl}${relativeUrl}` : relativeUrl;

  return {
    url: fullUrl,
    filename: safeName,
    storage: "local",
  };
};

/* =========================================
   IMAGE CLEANUP METHOD
========================================= */

export const deleteImage = async (imageUrl) => {
  if (!imageUrl || typeof imageUrl !== "string") return;

  try {
    // 1. Check if Cloudinary URL
    if (imageUrl.includes("res.cloudinary.com")) {
      const parts = imageUrl.split("/");
      const uploadIdx = parts.indexOf("upload");
      if (uploadIdx !== -1) {
        // e.g. "tastybites/menu/filename"
        const publicPath = parts.slice(uploadIdx + 2).join("/");
        const publicId = publicPath.replace(path.extname(publicPath), "");
        if (isCloudinaryConfigured) {
          await cloudinary.uploader.destroy(publicId);
          console.log(`[CLEANUP] Deleted Cloudinary image: ${publicId}`);
        }
      }
      return;
    }

    // 2. Check if local /uploads/menu/ URL
    if (imageUrl.includes("/uploads/menu/")) {
      const filename = imageUrl.split("/uploads/menu/")[1]?.split("?")[0];
      if (filename) {
        const filePath = path.join(UPLOADS_DIR, filename);
        if (fs.existsSync(filePath)) {
          await fs.promises.unlink(filePath);
          console.log(`[CLEANUP] Deleted local image: ${filePath}`);
        }
      }
    }
  } catch (error) {
    console.error(`[CLEANUP] Failed to remove unused image ${imageUrl}:`, error.message);
  }
};
