import { v2 as cloudinary } from 'cloudinary';
import { config } from 'dotenv';
import { Readable } from 'stream';

config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const uploadToCloudinary = async (file: any): Promise<string> => {
  if (!file) {
    throw new Error("No image provided");
  }

  console.log("req.file", file);

  // Handle both file.path (disk storage) and file.buffer (memory storage)
  const uploadStream = file.path
    // ? await cloudinary.uploader.upload_large(file.path)
    ? await new Promise<{ secure_url: string }>((resolve, reject) => {
      cloudinary.uploader.upload_large(file.path, (error: any, result: { secure_url: string }) => {
        if (error) {
          console.log("Cloudinary upload error", error);
          reject(error);
        } else {
          resolve(result);
        }
      });
    })
    : new Promise<{ secure_url: string }>((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { resource_type: 'auto' },
        (error: any, result: any) => {
          if (error) {
            console.log("Cloudinary upload error", error);
            reject(error);
          } else {
            resolve(result);
          }
        }
      );

      // Convert buffer to stream and pipe to upload
      Readable.from(file.buffer).pipe(stream);
    });

  const result = await uploadStream;
  return result.secure_url;
};

// export default cloudinary;

