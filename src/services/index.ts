// Authentication service
export { authService, AuthService } from './AuthService'
export type { LoginResult, SessionValidationResult } from './AuthService'

// Task service
export { taskService, TaskService } from './TaskService'
export type {
  CreateTaskInput,
  UpdateTaskInput,
  TaskWithAssignee,
  TaskHistoryEntry,
} from './TaskService'

// Project service
export { projectService, ProjectService } from './ProjectService'
export type {
  CreateProjectInput,
  UpdateProjectInput,
  ProjectListItem,
  ProjectWithMembers,
  ProjectStatus,
  ProjectType,
} from './ProjectService'

// Team service
export { teamService, TeamService } from './TeamService'
export type {
  ProjectMemberDetails,
  InviteMemberInput,
  InviteStatus,
} from './TeamService'

// Dashboard service
export { dashboardService, DashboardService } from './DashboardService'
export type {
  DashboardStats,
  RecentProject,
  DashboardData,
} from './DashboardService'

// Notification service
export { notificationService, NotificationService } from './NotificationService'
export type {
  CreateNotificationInput,
  NotificationWithDetails,
} from './NotificationService'

// Comment service
export { commentService, CommentService } from './CommentService'
export type {
  CommentWithAuthor,
  CreateCommentInput,
} from './CommentService'

// File storage service
export { fileStorageService, FileStorageService } from './FileStorageService'
export type { UploadResult } from './FileStorageService'

// File service
export { fileService, FileService } from './FileService'
export type {
  FileWithUploader,
  CreateFileInput,
} from './FileService'
