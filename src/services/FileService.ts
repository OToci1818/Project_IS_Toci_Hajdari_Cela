import { prisma } from '@/lib/prisma'
import { fileStorageService } from './FileStorageService'

export interface FileWithUploader {
  id: string
  taskId: string
  filename: string
  s3Key: string | null
  sizeBytes: bigint
  mimeType: string | null
  createdAt: Date
  uploader: {
    id: string
    fullName: string
    email: string
  }
}

export interface CreateFileInput {
  taskId: string
  uploadedById: string
  filename: string
  key: string
  size: number
  mimeType: string
}

/**
 * FileService handles file metadata and storage operations.
 */
class FileService {
  /**
   * Create a file record in the database.
   */
  async createFile(input: CreateFileInput): Promise<FileWithUploader> {
    const { taskId, uploadedById, filename, key, size, mimeType } = input

    const file = await prisma.file.create({
      data: {
        taskId,
        uploadedBy: uploadedById,
        filename,
        s3Key: key,
        sizeBytes: BigInt(size),
        mimeType,
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return file
  }

  /**
   * Get all files for a task.
   */
  async getFilesByTask(taskId: string): Promise<FileWithUploader[]> {
    const files = await prisma.file.findMany({
      where: { taskId },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return files
  }

  /**
   * Get all files for a project (across all its tasks).
   */
  async getFilesByProject(projectId: string): Promise<(FileWithUploader & { task: { id: string; title: string } })[]> {
    const files = await prisma.file.findMany({
      where: {
        task: {
          projectId,
          isDeleted: false,
        },
      },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
        task: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return files
  }

  /**
   * Get a single file by ID.
   */
  async getFileById(fileId: string): Promise<FileWithUploader | null> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return file
  }

  /**
   * Get a file by its storage key.
   */
  async getFileByKey(key: string): Promise<FileWithUploader | null> {
    const file = await prisma.file.findFirst({
      where: { s3Key: key },
      include: {
        uploader: {
          select: {
            id: true,
            fullName: true,
            email: true,
          },
        },
      },
    })

    return file
  }

  /**
   * Delete a file. Only the uploader can delete their own files.
   */
  async deleteFile(fileId: string, userId: string): Promise<boolean> {
    const file = await prisma.file.findUnique({
      where: { id: fileId },
    })

    if (!file || file.uploadedBy !== userId) {
      return false
    }

    // Delete from storage
    if (file.s3Key) {
      await fileStorageService.delete(file.s3Key)
    }

    // Delete from database
    await prisma.file.delete({
      where: { id: fileId },
    })

    return true
  }

  /**
   * Format file size for display.
   */
  formatFileSize(bytes: bigint | number): string {
    const size = typeof bytes === 'bigint' ? Number(bytes) : bytes
    if (size < 1024) return `${size} B`
    if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`
    return `${(size / (1024 * 1024)).toFixed(1)} MB`
  }
}

// Export a singleton instance
export const fileService = new FileService()

// Also export the class for testing
export { FileService }
