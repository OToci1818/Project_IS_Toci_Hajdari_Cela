'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Input, Modal } from '@/components'

interface Course {
  id: string
  title: string
  code: string
}

interface TeamMember {
  id: string
  fullName: string
  email: string
  avatarUrl?: string
}

interface Project {
  id: string
  title: string
  description?: string
  courseId?: string
  course?: Course
  projectType: 'individual' | 'group'
  status: 'active' | 'completed' | 'archived'
  progress: number
  deadlineDate?: string
  teamLeaderId: string
  teamLeader: TeamMember
  memberCount: number
  members: TeamMember[]
  taskStats: { total: number; done: number }
  hasGrade: boolean
  grade?: {
    gradeType: 'numeric' | 'letter'
    numericGrade?: number
    letterGrade?: string
  }
  submissionStatus: string | null
  createdAt: string
  updatedAt: string
}

const statusOptions = ['all', 'active', 'completed', 'archived']

const letterGrades = ['A+', 'A', 'A-', 'B+', 'B', 'B-', 'C+', 'C', 'C-', 'D+', 'D', 'D-', 'F']

export default function ProfessorProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([])
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [courseFilter, setCourseFilter] = useState('all')
  const [search, setSearch] = useState('')

  // Grading modal state
  const [showGradeModal, setShowGradeModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [gradeData, setGradeData] = useState({
    gradeType: 'numeric' as 'numeric' | 'letter',
    numericGrade: '',
    letterGrade: 'A',
    feedback: '',
  })
  const [grading, setGrading] = useState(false)

  // Review modal state
  const [showReviewModal, setShowReviewModal] = useState(false)
  const [reviewProject, setReviewProject] = useState<Project | null>(null)
  const [reviewComment, setReviewComment] = useState('')
  const [reviewing, setReviewing] = useState(false)

  const fetchProjects = useCallback(async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams()
      if (filter !== 'all') {
        params.set('status', filter)
      }
      if (courseFilter !== 'all') {
        params.set('courseId', courseFilter)
      }
      if (search) {
        params.set('search', search)
      }

      const response = await fetch(`/api/professor/projects?${params}`)
      if (response.ok) {
        const data = await response.json()
        setProjects(data.projects)
        setCourses(data.courses)
      }
    } catch (error) {
      console.error('Failed to fetch projects:', error)
    } finally {
      setLoading(false)
    }
  }, [filter, courseFilter, search])

  useEffect(() => {
    fetchProjects()
  }, [fetchProjects])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge variant="info">Active</Badge>
      case 'completed':
        return <Badge variant="success">Completed</Badge>
      case 'archived':
        return <Badge variant="default">Archived</Badge>
      default:
        return null
    }
  }

  const getSubmissionBadge = (status: string | null) => {
    if (!status) return null
    switch (status) {
      case 'submitted':
        return <Badge variant="warning">Awaiting Review</Badge>
      case 'approved':
        return <Badge variant="success">Approved</Badge>
      case 'needs_revision':
        return <Badge variant="error">Needs Revision</Badge>
      case 'draft':
        return <Badge variant="default">Draft</Badge>
      default:
        return null
    }
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'No deadline'
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const formatGrade = (project: Project) => {
    if (!project.grade) return null
    if (project.grade.gradeType === 'numeric') {
      return `${project.grade.numericGrade}/100`
    }
    return project.grade.letterGrade
  }

  const openGradeModal = (project: Project) => {
    setSelectedProject(project)
    if (project.grade) {
      setGradeData({
        gradeType: project.grade.gradeType,
        numericGrade: project.grade.numericGrade?.toString() || '',
        letterGrade: project.grade.letterGrade || 'A',
        feedback: '',
      })
    } else {
      setGradeData({
        gradeType: 'numeric',
        numericGrade: '',
        letterGrade: 'A',
        feedback: '',
      })
    }
    setShowGradeModal(true)
  }

  const handleSubmitGrade = async () => {
    if (!selectedProject) return

    if (gradeData.gradeType === 'numeric') {
      const grade = parseInt(gradeData.numericGrade)
      if (isNaN(grade) || grade < 0 || grade > 100) {
        alert('Please enter a valid grade between 0 and 100')
        return
      }
    }

    setGrading(true)
    try {
      const response = await fetch(`/api/projects/${selectedProject.id}/grade`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gradeType: gradeData.gradeType,
          numericGrade: gradeData.gradeType === 'numeric' ? parseInt(gradeData.numericGrade) : undefined,
          letterGrade: gradeData.gradeType === 'letter' ? gradeData.letterGrade : undefined,
          feedback: gradeData.feedback || undefined,
        }),
      })

      if (response.ok) {
        const data = await response.json()
        // Update the project in the list
        setProjects((prev) =>
          prev.map((p) =>
            p.id === selectedProject.id
              ? { ...p, hasGrade: true, grade: data.grade }
              : p
          )
        )
        setShowGradeModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to save grade')
      }
    } catch (error) {
      console.error('Failed to save grade:', error)
      alert('Failed to save grade')
    } finally {
      setGrading(false)
    }
  }

  const openReviewModal = (project: Project) => {
    setReviewProject(project)
    setReviewComment('')
    setShowReviewModal(true)
  }

  const handleReviewSubmission = async (action: 'approve' | 'request_revision') => {
    if (!reviewProject) return

    setReviewing(true)
    try {
      const response = await fetch(`/api/projects/${reviewProject.id}/submission`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action,
          reviewComment: reviewComment || undefined,
        }),
      })

      if (response.ok) {
        // Update the project in the list
        setProjects((prev) =>
          prev.map((p) =>
            p.id === reviewProject.id
              ? { ...p, submissionStatus: action === 'approve' ? 'approved' : 'needs_revision' }
              : p
          )
        )
        setShowReviewModal(false)
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to review submission')
      }
    } catch (error) {
      console.error('Failed to review submission:', error)
      alert('Failed to review submission')
    } finally {
      setReviewing(false)
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Student Projects</h1>
          <p className="text-muted-foreground mt-1">View and manage all projects from your courses</p>
        </div>
      </div>

      {/* Filters Card */}
      <Card className="mb-6">
        <div className="flex items-center gap-2 mb-4">
          <svg className="w-5 h-5 text-muted-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
          </svg>
          <span className="text-sm font-medium text-muted-foreground">Filters:</span>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          {/* Search */}
          <div className="flex-1 min-w-[200px]">
            <Input
              placeholder="Search projects..."
              value={search}
              onChange={setSearch}
              icon={
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              }
            />
          </div>

          {/* Course Filter */}
          <select
            value={courseFilter}
            onChange={(e) => setCourseFilter(e.target.value)}
            className="px-3 py-2.5 rounded-[0.625rem] border border-input bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary min-w-[180px]"
          >
            <option value="all">All Courses</option>
            {courses.map((course) => (
              <option key={course.id} value={course.id}>
                {course.code} - {course.title}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <div className="flex items-center gap-2">
            {statusOptions.map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-3 py-2 rounded-[0.625rem] text-sm font-medium transition-all ${
                  filter === status
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
      </Card>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-card-foreground">{projects.length}</p>
            <p className="text-sm text-muted-foreground">Total Projects</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-info">{projects.filter((p) => p.status === 'active').length}</p>
            <p className="text-sm text-muted-foreground">Active</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-warning">{projects.filter((p) => p.submissionStatus === 'submitted').length}</p>
            <p className="text-sm text-muted-foreground">Awaiting Review</p>
          </div>
        </Card>
        <Card>
          <div className="text-center">
            <p className="text-2xl font-bold text-success">{projects.filter((p) => p.hasGrade).length}</p>
            <p className="text-sm text-muted-foreground">Graded</p>
          </div>
        </Card>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      )}

      {/* Projects Table */}
      {!loading && projects.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Project</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Course</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Team</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Progress</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Deadline</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Submission</th>
                  <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Grade</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.id} className="border-b border-border last:border-0 hover:bg-muted/30">
                    <td className="py-3 px-4">
                      <div>
                        <p className="font-medium text-card-foreground">{project.title}</p>
                        <p className="text-sm text-muted-foreground truncate max-w-[200px]">
                          {project.description || 'No description'}
                        </p>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      {project.course && (
                        <Badge variant="outline">{project.course.code}</Badge>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="flex -space-x-2">
                          {project.members.slice(0, 3).map((member) => (
                            <div
                              key={member.id}
                              className="w-7 h-7 rounded-full bg-primary/20 flex items-center justify-center border-2 border-card"
                              title={member.fullName}
                            >
                              {member.avatarUrl ? (
                                <img src={member.avatarUrl} alt={member.fullName} className="w-full h-full rounded-full" />
                              ) : (
                                <span className="text-xs font-medium text-primary">
                                  {member.fullName.charAt(0)}
                                </span>
                              )}
                            </div>
                          ))}
                          {project.memberCount > 3 && (
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center border-2 border-card">
                              <span className="text-xs text-muted-foreground">+{project.memberCount - 3}</span>
                            </div>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">{project.memberCount} members</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2">
                        <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${project.progress === 100 ? 'bg-success' : 'bg-primary'}`}
                            style={{ width: `${project.progress}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground">{project.progress}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className="text-sm text-muted-foreground">{formatDate(project.deadlineDate)}</span>
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(project.status)}
                    </td>
                    <td className="py-3 px-4">
                      {getSubmissionBadge(project.submissionStatus)}
                    </td>
                    <td className="py-3 px-4">
                      {project.hasGrade ? (
                        <Badge variant="success">{formatGrade(project)}</Badge>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {project.submissionStatus === 'submitted' && (
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openReviewModal(project)}
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Review
                          </Button>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openGradeModal(project)}
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                          {project.hasGrade ? 'Edit Grade' : 'Grade'}
                        </Button>
                        <Link href={`/dashboard/projects/${project.id}`}>
                          <Button variant="outline" size="sm">
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </Button>
                        </Link>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Empty State */}
      {!loading && projects.length === 0 && (
        <Card>
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-muted-foreground mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <h3 className="text-lg font-semibold text-card-foreground mb-2">No projects found</h3>
            <p className="text-muted-foreground mb-4">
              {courses.length === 0
                ? 'Create a course first to have student projects'
                : 'No students have created projects in your courses yet'}
            </p>
            {courses.length === 0 && (
              <Link href="/dashboard/courses">
                <Button>Create Course</Button>
              </Link>
            )}
          </div>
        </Card>
      )}

      {/* Review Modal */}
      <Modal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title={`Review Submission: ${reviewProject?.title}`}
      >
        <div className="space-y-4">
          {/* Project Info */}
          <div className="bg-muted/50 rounded-[0.625rem] p-4">
            <h4 className="text-sm font-medium text-card-foreground mb-2">Submission Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Course: {reviewProject?.course?.code} - {reviewProject?.course?.title}</p>
              <p>Team Leader: {reviewProject?.teamLeader.fullName}</p>
              <p>Progress: {reviewProject?.progress}%</p>
            </div>
          </div>

          {/* Review Comment */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Review Comment (optional)
            </label>
            <textarea
              value={reviewComment}
              onChange={(e) => setReviewComment(e.target.value)}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
              placeholder="Enter feedback for the student team..."
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowReviewModal(false)}
            >
              Cancel
            </Button>
            <Button
              variant="secondary"
              onClick={() => handleReviewSubmission('request_revision')}
              loading={reviewing}
            >
              Request Revision
            </Button>
            <Button
              onClick={() => handleReviewSubmission('approve')}
              loading={reviewing}
            >
              Approve
            </Button>
          </div>
        </div>
      </Modal>

      {/* Grading Modal */}
      <Modal
        isOpen={showGradeModal}
        onClose={() => setShowGradeModal(false)}
        title={`Grade: ${selectedProject?.title}`}
      >
        <div className="space-y-4">
          {/* Grade Type Toggle */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Grade Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gradeType"
                  value="numeric"
                  checked={gradeData.gradeType === 'numeric'}
                  onChange={() => setGradeData({ ...gradeData, gradeType: 'numeric' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-card-foreground">Numeric (0-100)</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="gradeType"
                  value="letter"
                  checked={gradeData.gradeType === 'letter'}
                  onChange={() => setGradeData({ ...gradeData, gradeType: 'letter' })}
                  className="text-primary focus:ring-primary"
                />
                <span className="text-card-foreground">Letter Grade</span>
              </label>
            </div>
          </div>

          {/* Grade Input */}
          {gradeData.gradeType === 'numeric' ? (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Grade (0-100)
              </label>
              <input
                type="number"
                min="0"
                max="100"
                value={gradeData.numericGrade}
                onChange={(e) => setGradeData({ ...gradeData, numericGrade: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Enter grade..."
              />
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-2">
                Letter Grade
              </label>
              <select
                value={gradeData.letterGrade}
                onChange={(e) => setGradeData({ ...gradeData, letterGrade: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {letterGrades.map((grade) => (
                  <option key={grade} value={grade}>{grade}</option>
                ))}
              </select>
            </div>
          )}

          {/* Feedback */}
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-2">
              Feedback (optional)
            </label>
            <textarea
              value={gradeData.feedback}
              onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary min-h-[100px] resize-none"
              placeholder="Enter feedback for the student..."
            />
          </div>

          {/* Project Info */}
          <div className="bg-muted/50 rounded-[0.625rem] p-4">
            <h4 className="text-sm font-medium text-card-foreground mb-2">Project Details</h4>
            <div className="space-y-1 text-sm text-muted-foreground">
              <p>Course: {selectedProject?.course?.code} - {selectedProject?.course?.title}</p>
              <p>Team Leader: {selectedProject?.teamLeader.fullName}</p>
              <p>Progress: {selectedProject?.progress}%</p>
              <p>Status: {selectedProject?.status}</p>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowGradeModal(false)}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmitGrade}
              loading={grading}
            >
              {selectedProject?.hasGrade ? 'Update Grade' : 'Save Grade'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}
