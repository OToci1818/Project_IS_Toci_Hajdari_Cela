'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Card, Badge, Button, Modal } from '@/components'

interface Course {
  id: string
  title: string
  code: string
  description: string | null
  semester: string
  year: number
  isActive: boolean
  professor: {
    id: string
    fullName: string
    email: string
  }
  _count: {
    enrollments: number
    projects: number
  }
  enrolledAt?: string
}

interface User {
  id: string
  role: string
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [availableCourses, setAvailableCourses] = useState<Course[]>([])
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showEnrollModal, setShowEnrollModal] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    code: '',
    description: '',
    semester: 'Fall',
    year: new Date().getFullYear(),
  })
  const [creating, setCreating] = useState(false)
  const [enrolling, setEnrolling] = useState<string | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [userRes, coursesRes] = await Promise.all([
        fetch('/api/auth/me'),
        fetch('/api/courses'),
      ])

      if (userRes.ok) {
        const userData = await userRes.json()
        setUser(userData.user)

        // If student, also fetch available courses
        if (userData.user.role !== 'professor') {
          const availableRes = await fetch('/api/courses?type=available')
          if (availableRes.ok) {
            const availableData = await availableRes.json()
            setAvailableCourses(availableData.courses)
          }
        }
      }

      if (coursesRes.ok) {
        const coursesData = await coursesRes.json()
        setCourses(coursesData.courses)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreating(true)

    try {
      const response = await fetch('/api/courses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      if (response.ok) {
        const data = await response.json()
        setCourses((prev) => [data.course, ...prev])
        setShowCreateModal(false)
        setFormData({
          title: '',
          code: '',
          description: '',
          semester: 'Fall',
          year: new Date().getFullYear(),
        })
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to create course')
      }
    } catch (error) {
      console.error('Failed to create course:', error)
      alert('Failed to create course')
    } finally {
      setCreating(false)
    }
  }

  const handleEnroll = async (courseId: string) => {
    setEnrolling(courseId)

    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
      })

      if (response.ok) {
        // Move course from available to enrolled
        const enrolledCourse = availableCourses.find((c) => c.id === courseId)
        if (enrolledCourse) {
          setCourses((prev) => [...prev, enrolledCourse])
          setAvailableCourses((prev) => prev.filter((c) => c.id !== courseId))
        }
      } else {
        const error = await response.json()
        alert(error.error || 'Failed to enroll')
      }
    } catch (error) {
      console.error('Failed to enroll:', error)
      alert('Failed to enroll')
    } finally {
      setEnrolling(null)
    }
  }

  const isProfessor = user?.role === 'professor'

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-card-foreground">
            {isProfessor ? 'My Courses' : 'Courses'}
          </h1>
          <p className="text-muted-foreground mt-1">
            {isProfessor
              ? 'Manage your courses and view enrolled students'
              : 'View and enroll in available courses'}
          </p>
        </div>
        {isProfessor && (
          <Button onClick={() => setShowCreateModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Create Course
          </Button>
        )}
        {!isProfessor && availableCourses.length > 0 && (
          <Button onClick={() => setShowEnrollModal(true)}>
            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Enroll in Course
          </Button>
        )}
      </div>

      {/* Courses Grid */}
      {courses.length === 0 ? (
        <Card>
          <div className="text-center py-12">
            <svg
              className="w-16 h-16 mx-auto text-muted-foreground mb-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
              />
            </svg>
            <h3 className="text-lg font-medium text-card-foreground mb-2">
              {isProfessor ? 'No courses yet' : 'Not enrolled in any courses'}
            </h3>
            <p className="text-muted-foreground mb-4">
              {isProfessor
                ? 'Create your first course to get started'
                : 'Enroll in a course to see it here'}
            </p>
            {isProfessor ? (
              <Button onClick={() => setShowCreateModal(true)}>Create Course</Button>
            ) : (
              availableCourses.length > 0 && (
                <Button onClick={() => setShowEnrollModal(true)}>Browse Courses</Button>
              )
            )}
          </div>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {courses.map((course) => (
            <Link key={course.id} href={`/dashboard/courses/${course.id}`}>
              <Card className="h-full hover:border-primary/50 transition-colors cursor-pointer">
                <div className="flex flex-col h-full">
                  <div className="flex items-start justify-between mb-3">
                    <Badge variant="info">{course.code}</Badge>
                    <Badge variant={course.isActive ? 'success' : 'warning'}>
                      {course.isActive ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <h3 className="text-lg font-semibold text-card-foreground mb-2">
                    {course.title}
                  </h3>
                  {course.description && (
                    <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="mt-auto space-y-2 text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                        />
                      </svg>
                      <span>{course.professor.fullName}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <span>
                        {course.semester} {course.year}
                      </span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"
                          />
                        </svg>
                        {course._count.enrollments} students
                      </span>
                      <span className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z"
                          />
                        </svg>
                        {course._count.projects} projects
                      </span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          ))}
        </div>
      )}

      {/* Create Course Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Create New Course"
      >
        <form onSubmit={handleCreateCourse} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Course Title *
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., Software Engineering"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Course Code *
            </label>
            <input
              type="text"
              value={formData.code}
              onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="e.g., CS401"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-card-foreground mb-1">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Course description..."
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Semester *
              </label>
              <select
                value={formData.semester}
                onChange={(e) => setFormData({ ...formData, semester: e.target.value })}
                className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                required
              >
                <option value="Fall">Fall</option>
                <option value="Spring">Spring</option>
                <option value="Summer">Summer</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Year *
              </label>
              <input
                type="number"
                value={formData.year}
                onChange={(e) => setFormData({ ...formData, year: parseInt(e.target.value) })}
                className="w-full px-4 py-2 border border-border rounded-[0.625rem] bg-card text-card-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                min={2020}
                max={2030}
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setShowCreateModal(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={creating}>
              {creating ? 'Creating...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Enroll Modal */}
      <Modal
        isOpen={showEnrollModal}
        onClose={() => setShowEnrollModal(false)}
        title="Available Courses"
        size="lg"
      >
        <div className="space-y-4">
          {availableCourses.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              No available courses to enroll in
            </p>
          ) : (
            availableCourses.map((course) => (
              <div
                key={course.id}
                className="p-4 border border-border rounded-[0.625rem] flex items-center justify-between"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <Badge variant="info">{course.code}</Badge>
                    <h3 className="font-medium text-card-foreground">{course.title}</h3>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {course.professor.fullName} • {course.semester} {course.year}
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => handleEnroll(course.id)}
                  disabled={enrolling === course.id}
                >
                  {enrolling === course.id ? 'Enrolling...' : 'Enroll'}
                </Button>
              </div>
            ))
          )}
        </div>
      </Modal>
    </div>
  )
}
