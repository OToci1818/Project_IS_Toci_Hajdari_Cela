import { prisma } from '@/lib/prisma'

export interface CommentWithAuthor {
  id: string
  taskId: string
  authorId: string
  content: string
  createdAt: Date
  updatedAt: Date
  author: {
    id: string
    fullName: string
    email: string
    avatarUrl?: string
  }
}

export interface CreateCommentInput {
  taskId: string
  authorId: string
  content: string
}

/**
 * CommentService handles all comment-related business logic:
 * - CRUD operations for comments
 * - Authorization checks (only author can edit/delete)
 */
class CommentService {
  /**
   * Create a new comment on a task.
   */
  async createComment(input: CreateCommentInput): Promise<CommentWithAuthor> {
    const { taskId, authorId, content } = input

    const comment = await prisma.comment.create({
      data: {
        taskId,
        authorId,
        content,
      },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        fullName: comment.author.fullName,
        email: comment.author.email,
        avatarUrl: comment.author.avatarUrl ?? undefined,
      },
    }
  }

  /**
   * Get comments for a task, filtered by authorId (private notes - only author sees their own).
   */
  async getCommentsByTask(taskId: string, userId: string): Promise<CommentWithAuthor[]> {
    const comments = await prisma.comment.findMany({
      where: { taskId, authorId: userId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    })

    return comments.map((comment) => ({
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        fullName: comment.author.fullName,
        email: comment.author.email,
        avatarUrl: comment.author.avatarUrl ?? undefined,
      },
    }))
  }

  /**
   * Get a single comment by ID.
   */
  async getCommentById(commentId: string): Promise<CommentWithAuthor | null> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    if (!comment) return null

    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        fullName: comment.author.fullName,
        email: comment.author.email,
        avatarUrl: comment.author.avatarUrl ?? undefined,
      },
    }
  }

  /**
   * Update a comment. Only the author can update their own comment.
   */
  async updateComment(
    commentId: string,
    content: string,
    userId: string
  ): Promise<CommentWithAuthor | null> {
    // Check if the comment exists and user is the author
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!existing || existing.authorId !== userId) {
      return null
    }

    const comment = await prisma.comment.update({
      where: { id: commentId },
      data: { content },
      include: {
        author: {
          select: {
            id: true,
            fullName: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    })

    return {
      id: comment.id,
      taskId: comment.taskId,
      authorId: comment.authorId,
      content: comment.content,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      author: {
        id: comment.author.id,
        fullName: comment.author.fullName,
        email: comment.author.email,
        avatarUrl: comment.author.avatarUrl ?? undefined,
      },
    }
  }

  /**
   * Delete a comment. Only the author can delete their own comment.
   */
  async deleteComment(commentId: string, userId: string): Promise<boolean> {
    // Check if the comment exists and user is the author
    const existing = await prisma.comment.findUnique({
      where: { id: commentId },
    })

    if (!existing || existing.authorId !== userId) {
      return false
    }

    await prisma.comment.delete({
      where: { id: commentId },
    })

    return true
  }
}

// Export a singleton instance
export const commentService = new CommentService()

// Also export the class for testing
export { CommentService }
