"use server";

import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

export async function uploadImage(formData: FormData): Promise<{ ok: true; path: string } | { ok: false; error: string }> {
  try {
    const file = formData.get("file") as File;
    
    if (!file) {
      return { ok: false, error: "No file provided" };
    }

    // Validate file type - allow all image formats
    if (!file.type.startsWith("image/")) {
      return { ok: false, error: "Invalid file type. Only image files are allowed." };
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      return { ok: false, error: "File too large. Maximum size is 10MB." };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = file.name.split('.').pop();
    const filename = `product-${timestamp}-${randomString}.${extension}`;

    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), "public", "uploads");
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true });
    }

    // Convert file to buffer and save
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    if (buffer.length === 0) {
      console.error("Upload error: received empty file buffer", {
        name: file.name,
        type: file.type,
        size: file.size,
      });
      return { ok: false, error: "Upload failed: empty file received" };
    }
    const filepath = join(uploadsDir, filename);
    
    await writeFile(filepath, buffer);

    // Return public path
    const publicPath = `/uploads/${filename}`;
    return { ok: true, path: publicPath };

  } catch (error) {
    console.error("Image upload error:", error);
    return { ok: false, error: "Failed to upload image" };
  }
}

export async function uploadMultipleImages(formData: FormData): Promise<{ ok: true; paths: string[] } | { ok: false; error: string }> {
  try {
    const files = formData.getAll("files") as File[];
    
    if (!files || files.length === 0) {
      return { ok: false, error: "No files provided" };
    }

    if (files.length > 20) {
      return { ok: false, error: "Maximum 20 images allowed at once" };
    }

    const paths: string[] = [];
    const errors: string[] = [];
    
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      
      const result = await uploadImage(fileFormData);
      if (!result.ok) {
        errors.push(`${file.name}: ${result.error}`);
        continue; // Continue uploading other files
      }
      
      paths.push(result.path);
    }
    
    // If some files failed but some succeeded, still return success with paths
    if (paths.length > 0 && errors.length > 0) {
      console.warn("Some files failed to upload:", errors);
      return { ok: true, paths };
    }
    
    // If all files failed
    if (paths.length === 0) {
      return { ok: false, error: errors.join("; ") || "All files failed to upload" };
    }

    return { ok: true, paths };

  } catch (error) {
    console.error("Multiple images upload error:", error);
    return { ok: false, error: "Failed to upload images" };
  }
}
