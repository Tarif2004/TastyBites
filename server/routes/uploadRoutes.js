import express from "express";
import { uploadMiddleware, processImageUpload } from "../services/imageUploadService.js";
import protect from "../middleware/authMiddleware.js";
import adminOnly from "../middleware/adminMiddleware.js";

const router = express.Router();

/* =========================================
   UPLOAD IMAGE (ADMIN & OWNER ONLY)
   POST /api/upload/image
========================================= */
router.post("/image", protect, adminOnly, (req, res) => {
  uploadMiddleware(req, res, async (err) => {
    if (err) {
      if (err.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          success: false,
          message: "File is too large. Maximum permitted size is 5 MB.",
        });
      }
      return res.status(400).json({
        success: false,
        message: err.message || "File upload error",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image file to upload (JPG, PNG, or WEBP).",
      });
    }

    try {
      // Build server origin URL for local fallback
      const protocol = req.headers["x-forwarded-proto"] || req.protocol;
      const host = req.get("host");
      const hostUrl = `${protocol}://${host}`;

      const uploadResult = await processImageUpload(req.file, hostUrl);

      return res.status(200).json({
        success: true,
        message: "Image uploaded successfully",
        url: uploadResult.url,
        storage: uploadResult.storage,
      });
    } catch (uploadError) {
      console.error("Upload processing error:", uploadError);
      return res.status(500).json({
        success: false,
        message: uploadError.message || "Failed to process image upload",
      });
    }
  });
});

export default router;
