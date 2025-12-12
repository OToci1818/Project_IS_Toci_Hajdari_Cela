export type UserRole = 'student' | 'team_leader' | 'professor' | 'admin'

export interface User {
  id: string
  email: string
  fullName: string
  role: UserRole
  avatarUrl?: string
  isActive: boolean
  createdAt: Date
  updatedAt: Date
  lastLoginAt?: Date
}

export type ProjectStatus = 'active' | 'completed' | 'archived'
export type ProjectType = 'individual' | 'group'
export type InviteStatus = 'pending' | 'accepted' | 'declined'

export interface Project {
  id: string
  title: string
  description?: string
  courseCode?: string
  projectType: ProjectType
  teamLeaderId: string
  status: ProjectStatus
  deadlineDate?: Date
  createdAt: Date
  updatedAt: Date
}

export interface ProjectMember {
  id: string
  projectId: string
  userId: string
  role: UserRole
  inviteStatus: InviteStatus
  joinedAt?: Date
  user?: User
}

export type TaskStatus = 'to_do' | 'in_progress' | 'done' | 'archived'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Task {
  id: string
  projectId: string
  title: string
  description?: string
  priority: TaskPriority
  status: TaskStatus
  assigneeId?: string
  ordinal: number
  createdById: string
  createdAt: Date
  updatedAt: Date
  dueDate?: Date
  assignee?: User
}

export interface ApiResponse<T> {
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

export interface LoginRequest {
  email: string
  password: string
}

export interface AuthResponse {
  user: User
  token: string
}
