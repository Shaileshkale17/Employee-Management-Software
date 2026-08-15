import { v2 as cloudinary } from "cloudinary";
import path from "path";
import fs from "fs";

const LOCAL_UPLOAD_DIR = path.resolve("uploads");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const isCloudinaryConfigured = () =>
  Boolean(
    process.env.CLOUDINARY_CLOUD_NAME &&
      process.env.CLOUDINARY_API_KEY &&
      process.env.CLOUDINARY_API_SECRET
  );

const safeName = (name) =>
  String(name || "file")
    .replace(/[^a-zA-Z0-9.\-_]/g, "_")
    .slice(0, 60);

const resourceTypeOf = (mimetype = "") =>
  mimetype.startsWith("image/")
    ? "image"
    : mimetype.startsWith("video/")
      ? "video"
      : "raw";

const writeLocal = async ({ buffer, originalname, mimetype }) => {
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  const ext =
    path.extname(safeName(originalname)) ||
    (mimetype ? `.${mimetype.split("/")[1] || ""}` : "");
  const filename = `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`;
  await fs.promises.writeFile(path.join(LOCAL_UPLOAD_DIR, filename), buffer);
  return { url: `/uploads/${filename}`, publicId: null, secure_url: `/uploads/${filename}` };
};

const uploadToCloudinary = ({ buffer, mimetype, originalname, folder }) => {
  const resourceType = resourceTypeOf(mimetype);
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder,
        resource_type: resourceType,
        public_id: `${Date.now()}-${Math.round(Math.random() * 1e9)}-${safeName(originalname)}`,
        use_filename: true,
        unique_filename: true,
        overwrite: false,
      },
      (error, result) => {
        if (error) return reject(error);
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
          secure_url: result.secure_url,
          size: result.bytes,
          format: result.format,
        });
      }
    );
    uploadStream.end(buffer);
  });
};

export const uploadFile = async (file, folder = "ems-uploads") => {
  if (!isCloudinaryConfigured()) return writeLocal(file);
  return uploadToCloudinary({ ...file, folder });
};

export const uploadMany = async (files, folder = "ems-uploads") => {
  const list = Array.isArray(files) ? files : files ? [files] : [];
  return Promise.all(list.map((file) => uploadFile(file, folder)));
};
