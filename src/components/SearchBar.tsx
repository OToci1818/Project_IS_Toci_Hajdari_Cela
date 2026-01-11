'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Badge from './Badge'

interface TaskResult {
  id: string
  title: string
  description?: string
  priority: 'low' | 'medium' | 'high'
  status: string
  dueDate?: string
  project: {
    id: string
    title: string
  }
  assignee?: {
    id: string
    fullName: string
  }
}

interface ProjectResult {
  id: string
  title: string
  courseCode?: string
  status: string
}

interface SearchResults {
  tasks: TaskResult[]
  projects: ProjectResult[]
}

export default function SearchBar() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResults | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Debounce search
  useEffect(() => {
    if (query.length < 2) {
      setResults(null)
      setIsOpen(false)
      return
    }

    const timer = setTimeout(async () => {
      setLoading(true)
      try {
        const response = await fetch(`/api/search?q=${encodeURIComponent(query)}`)
        if (response.ok) {
          const data = await response.json()
          setResults(data.results)
          setIsOpen(true)
        }
      } catch (error) {
        console.error('Search error:', error)
      } finally {
        setLoading(false)
      }
    }, 300)

    return () => clearTimeout(timer)
  }, [query])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      setIsOpen(false)
      inputRef.current?.blur()
    }
  }

  const handleTaskClick = (task: TaskResult) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/dashboard/projects/${task.project.id}?tab=tasks&task=${task.id}`)
  }

  const handleProjectClick = (project: ProjectResult) => {
    setIsOpen(false)
    setQuery('')
    router.push(`/dashboard/projects/${project.id}`)
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'danger'
      case 'medium':
        return 'warning'
      case 'low':
        return 'default'
      default:
        return 'default'
    }
  }

  const hasResults = results && (results.tasks.length > 0 || results.projects.length > 0)

  return (
    <div ref={containerRef} className="relative">
      <div className="relative">
        <svg
          className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-sidebar-muted"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>
        <input
          ref={inputRef}
          type="text"
          placeholder="Search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => query.length >= 2 && results && setIsOpen(true)}
          onKeyDown={handleKeyDown}
          className="w-full pl-9 pr-3 py-2 bg-sidebar-foreground/10 border border-sidebar-foreground/20 rounded-[0.625rem] text-sm text-sidebar-foreground placeholder:text-sidebar-muted focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-colors"
        />
        {loading && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
          </div>
        )}
      </div>

      {/* Results Dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-[0.625rem] shadow-lg z-50 max-h-96 overflow-y-auto">
          {!hasResults ? (
            <div className="p-4 text-center text-muted-foreground text-sm">
              No results found for &quot;{query}&quot;
            </div>
          ) : (
            <div className="py-2">
              {/* Projects Section */}
              {results.projects.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Projects
                  </div>
                  {results.projects.map((project) => (
                    <button
                      key={project.id}
                      onClick={() => handleProjectClick(project)}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors flex items-center gap-3"
                    >
                      <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center flex-shrink-0">
                        <svg className="w-4 h-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                        </svg>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-card-foreground truncate">
                          {project.title}
                        </div>
                        {project.courseCode && (
                          <div className="text-xs text-muted-foreground">
                            {project.courseCode}
                          </div>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Divider */}
              {results.projects.length > 0 && results.tasks.length > 0 && (
                <div className="my-2 border-t border-border" />
              )}

              {/* Tasks Section */}
              {results.tasks.length > 0 && (
                <div>
                  <div className="px-3 py-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tasks
                  </div>
                  {results.tasks.map((task) => (
                    <button
                      key={task.id}
                      onClick={() => handleTaskClick(task)}
                      className="w-full px-3 py-2 text-left hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-card-foreground truncate">
                          {task.title}
                        </span>
                        <Badge variant={getPriorityColor(task.priority) as 'danger' | 'warning' | 'default'}>
                          {task.priority}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <span className="truncate">{task.project.title}</span>
                        {task.assignee && (
                          <>
                            <span>•</span>
                            <span>{task.assignee.fullName}</span>
                          </>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
