import multer from "multer";
import { uploadMany } from "../utils/cloudinaryService.js";

const ALLOWED_MIME = {
  "application/pdf": ".pdf",
  "application/msword": ".doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
    ".docx",
  "text/plain": ".txt",
  "text/csv": ".csv",
  "application/vnd.ms-excel": ".xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": ".xlsx",
  "image/png": ".png",
  "image/jpeg": ".jpg",
  "image/webp": ".webp",
};

const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (ALLOWED_MIME[file.mimetype]) {
    return cb(null, true);
  }
  cb(new Error("Invalid file type"));
};

export const uploadResume = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter,
}).single("resume");

export const uploadAttachments = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
  fileFilter,
}).array("attachments", 5);

export const uploadLogo = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ["image/png", "image/jpeg", "image/webp"];
    if (allowed.includes(file.mimetype)) {
      return cb(null, true);
    }
    cb(new Error("Invalid image type"));
  },
}).single("logo");

export const cloudinaryUpload = async (req, res, next) => {
  try {
    const files = req.file ? [req.file] : req.files || [];
    if (!files.length) return next();
    const results = await uploadMany(files, req.folder || "ems-uploads");
    results.forEach((result, i) => {
      const file = files[i];
      file.url = result.url;
      file.publicId = result.publicId;
      file.cloudinaryUrl = result.secure_url;
    });
    next();
  } catch (error) {
    next(error);
  }
};
