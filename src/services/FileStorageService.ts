import { promises as fs } from 'fs'
import path from 'path'
import { randomUUID } from 'crypto'

const UPLOAD_DIR = process.env.FILE_UPLOAD_DIR || './uploads'
const MAX_FILE_SIZE = parseInt(process.env.FILE_MAX_SIZE || '10485760', 10) // 10MB default

export interface UploadResult {
  key: string
  url: string
  size: number
}

/**
 * FileStorageService handles file storage operations.
 * Uses local filesystem storage (can be swapped for S3 in production).
 */
class FileStorageService {
  private uploadDir: string

  constructor() {
    this.uploadDir = path.resolve(UPLOAD_DIR)
  }

  /**
   * Ensure the upload directory exists.
   */
  private async ensureUploadDir(): Promise<void> {
    try {
      await fs.access(this.uploadDir)
    } catch {
      await fs.mkdir(this.uploadDir, { recursive: true })
    }
  }

  /**
   * Get the maximum allowed file size in bytes.
   */
  getMaxFileSize(): number {
    return MAX_FILE_SIZE
  }

  /**
   * Upload a file and return its storage key and URL.
   */
  async upload(
    buffer: Buffer,
    filename: string,
    mimeType: string
  ): Promise<UploadResult> {
    await this.ensureUploadDir()

    if (buffer.length > MAX_FILE_SIZE) {
      throw new Error(`File size exceeds maximum allowed size of ${MAX_FILE_SIZE} bytes`)
    }

    // Generate unique key
    const ext = path.extname(filename)
    const key = `${randomUUID()}${ext}`
    const filePath = path.join(this.uploadDir, key)

    // Write file
    await fs.writeFile(filePath, buffer)

    return {
      key,
      url: `/api/files/${key}`,
      size: buffer.length,
    }
  }

  /**
   * Get the full file path for a given key.
   */
  getFilePath(key: string): string {
    return path.join(this.uploadDir, key)
  }

  /**
   * Read a file by its key.
   */
  async read(key: string): Promise<Buffer | null> {
    try {
      const filePath = this.getFilePath(key)
      return await fs.readFile(filePath)
    } catch {
      return null
    }
  }

  /**
   * Delete a file by its key.
   */
  async delete(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key)
      await fs.unlink(filePath)
      return true
    } catch {
      return false
    }
  }

  /**
   * Check if a file exists.
   */
  async exists(key: string): Promise<boolean> {
    try {
      const filePath = this.getFilePath(key)
      await fs.access(filePath)
      return true
    } catch {
      return false
    }
  }
}

// Export a singleton instance
export const fileStorageService = new FileStorageService()

// Also export the class for testing
export { FileStorageService }
