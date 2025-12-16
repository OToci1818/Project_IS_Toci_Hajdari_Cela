'use client'

import { useState } from 'react'
import { Button, Input } from '@/components'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({})
  const [loading, setLoading] = useState(false)
  const [setupLoading, setSetupLoading] = useState(false)
  const [setupMessage, setSetupMessage] = useState('')

  const validateEmail = (email: string): boolean => {
    const institutionalEmailRegex = /^[a-zA-Z0-9._%+-]+@fti\.edu\.al$/
    return institutionalEmailRegex.test(email)
  }

  const handleSetupDemo = async () => {
    setSetupLoading(true)
    setSetupMessage('')
    try {
      const response = await fetch('/api/setup', { method: 'POST' })
      const data = await response.json()

      if (response.ok) {
        setSetupMessage(`Demo user created! Email: ${data.user.email}, Password: ${data.password}`)
        setEmail(data.user.email)
        setPassword(data.password)
      } else {
        setSetupMessage(data.error || 'Failed to setup demo')
      }
    } catch {
      setSetupMessage('Failed to connect to server')
    } finally {
      setSetupLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setErrors({})

    const newErrors: { email?: string; password?: string } = {}

    if (!email) {
      newErrors.email = 'Email is required'
    } else if (!validateEmail(email)) {
      newErrors.email = 'Only @fti.edu.al emails are allowed'
    }

    if (!password) {
      newErrors.password = 'Password is required'
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters'
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })

      const data = await response.json()

      if (response.ok) {
        window.location.href = '/dashboard'
      } else {
        setErrors({ general: data.error || 'Login failed' })
      }
    } catch {
      setErrors({ general: 'Failed to connect to server' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#F7F9FC] flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-[#1A73E8] rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-[#1E293B]">UniProject</h1>
          <p className="text-[#64748B] mt-2">University Project Management System</p>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
          <h2 className="text-xl font-semibold text-[#1E293B] mb-6">Sign in to your account</h2>

          {errors.general && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
              {errors.general}
            </div>
          )}

          {setupMessage && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-600 text-sm">
              {setupMessage}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Email"
              type="email"
              placeholder="name@fti.edu.al"
              value={email}
              onChange={setEmail}
              error={errors.email}
              required
            />

            <Input
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={setPassword}
              error={errors.password}
              required
            />

            <div className="flex items-center justify-between text-sm">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded border-gray-300 text-[#1A73E8] focus:ring-[#1A73E8]"
                />
                <span className="text-[#64748B]">Remember me</span>
              </label>
              <a href="#" className="text-[#1A73E8] hover:underline">
                Forgot password?
              </a>
            </div>

            <Button
              type="submit"
              loading={loading}
              className="w-full mt-6"
            >
              Sign In
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-gray-100">
            <p className="text-sm text-[#64748B] text-center mb-4">
              Only institutional emails (@fti.edu.al) are accepted
            </p>
            <Button
              type="button"
              variant="secondary"
              loading={setupLoading}
              onClick={handleSetupDemo}
              className="w-full"
            >
              Setup Demo Account
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}
