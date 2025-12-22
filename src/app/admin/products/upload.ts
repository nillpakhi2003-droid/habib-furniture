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

    // Validate file type
    const validTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp", "image/gif"];
    if (!validTypes.includes(file.type)) {
      return { ok: false, error: "Invalid file type. Only JPG, PNG, WEBP, and GIF are allowed." };
    }

    // Validate file size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (file.size > maxSize) {
      return { ok: false, error: "File too large. Maximum size is 5MB." };
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

    if (files.length > 10) {
      return { ok: false, error: "Maximum 10 images allowed" };
    }

    const paths: string[] = [];
    
    for (const file of files) {
      const fileFormData = new FormData();
      fileFormData.append("file", file);
      
      const result = await uploadImage(fileFormData);
      if (!result.ok) {
        return { ok: false, error: result.error };
      }
      
      paths.push(result.path);
    }

    return { ok: true, paths };

  } catch (error) {
    console.error("Multiple images upload error:", error);
    return { ok: false, error: "Failed to upload images" };
  }
}
