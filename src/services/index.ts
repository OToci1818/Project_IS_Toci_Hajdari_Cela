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
