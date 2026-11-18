import fs from "fs/promises";
import path from "path";
import { existsSync } from "fs";

export class LocalStorageDriver {
  constructor(baseDir = "storage", publicUrlPrefix = "/storage") {
    this.baseDir = process.env.VERCEL
      ? path.join("/tmp", baseDir)
      : path.resolve(baseDir);
    this.publicUrlPrefix = publicUrlPrefix;
    this.ensureBaseDir();
  }

  async ensureBaseDir() {
    try {
      if (!existsSync(this.baseDir)) {
        await fs.mkdir(this.baseDir, { recursive: true });
      }
    } catch (err) {
      console.warn("[LocalStorageDriver] Unable to create baseDir:", err.message);
    }
  }

  getFilePath(key) {
    // Prevent path traversal
    const safeKey = key.replace(/\.\./g, "").replace(/^\/+/, "");
    return path.join(this.baseDir, safeKey);
  }

  /**
   * Upload / Save file buffer to local disk
   */
  async upload(fileBuffer, key, _contentType) {
    const fullPath = this.getFilePath(key);
    const dir = path.dirname(fullPath);

    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(fullPath, fileBuffer);

    return this.getUrl(key);
  }

  /**
   * Delete file from local disk
   */
  async delete(key) {
    if (!key) return;
    try {
      const fullPath = this.getFilePath(key);
      if (existsSync(fullPath)) {
        await fs.unlink(fullPath);
      }
    } catch (err) {
      console.error(`Failed to delete file at key: ${key}`, err);
    }
  }

  /**
   * Delete directory and all its contents recursively from local disk
   */
  async deleteDirectory(prefix) {
    if (!prefix) return;
    try {
      const fullPath = this.getFilePath(prefix);
      if (existsSync(fullPath)) {
        await fs.rm(fullPath, { recursive: true, force: true });
      }
    } catch (err) {
      console.error(`Failed to delete directory at prefix: ${prefix}`, err);
    }
  }

  /**
   * Check if file exists
   */
  async exists(key) {
    if (!key) return false;
    const fullPath = this.getFilePath(key);
    return existsSync(fullPath);
  }

  /**
   * Get public URL path
   */
  getUrl(key) {
    if (!key) return "";
    const cleanKey = key.replace(/^\/+/, "");
    return `${this.publicUrlPrefix}/${cleanKey}`;
  }
}

export const localStorageDriver = new LocalStorageDriver();
