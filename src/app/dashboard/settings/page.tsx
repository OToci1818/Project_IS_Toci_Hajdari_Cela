'use client'

import { useState, useEffect, useRef } from 'react'
import Image from 'next/image'
import { Card, Button, Input, Badge } from '@/components'

interface User {
  id: string
  email: string
  fullName: string
  role: string
  avatarUrl?: string
  createdAt: string
  lastLoginAt?: string
}

export default function SettingsPage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)

  // Form states
  const [fullName, setFullName] = useState('')
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')

  // Messages
  const [profileMessage, setProfileMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [avatarMessage, setAvatarMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [passwordMessage, setPasswordMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchUser()
  }, [])

  const fetchUser = async () => {
    try {
      setLoading(true)
      const response = await fetch('/api/auth/me')
      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFullName(data.user.fullName)
      }
    } catch (error) {
      console.error('Failed to fetch user:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setSaving(true)
    setProfileMessage(null)

    try {
      const response = await fetch(`/api/users/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ fullName: fullName.trim() }),
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setProfileMessage({ type: 'success', text: 'Profile updated successfully' })
      } else {
        setProfileMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (error) {
      setProfileMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setSaving(false)
    }
  }

  const handleAvatarClick = () => {
    fileInputRef.current?.click()
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file || !user) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setAvatarMessage({ type: 'error', text: 'Please select a valid image file (JPEG, PNG, GIF, or WebP)' })
      return
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setAvatarMessage({ type: 'error', text: 'Image must be less than 5MB' })
      return
    }

    setUploadingAvatar(true)
    setAvatarMessage(null)

    try {
      const formData = new FormData()
      formData.append('avatar', file)

      const response = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setAvatarMessage({ type: 'success', text: 'Avatar updated successfully' })
      } else {
        setAvatarMessage({ type: 'error', text: data.error || 'Failed to upload avatar' })
      }
    } catch (error) {
      setAvatarMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setUploadingAvatar(false)
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const handleRemoveAvatar = async () => {
    if (!user || !user.avatarUrl) return

    setUploadingAvatar(true)
    setAvatarMessage(null)

    try {
      const response = await fetch(`/api/users/${user.id}/avatar`, {
        method: 'DELETE',
      })

      const data = await response.json()

      if (response.ok) {
        setUser(data.user)
        setAvatarMessage({ type: 'success', text: 'Avatar removed successfully' })
      } else {
        setAvatarMessage({ type: 'error', text: data.error || 'Failed to remove avatar' })
      }
    } catch (error) {
      setAvatarMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setUploadingAvatar(false)
    }
  }

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    // Validate
    if (newPassword !== confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' })
      return
    }

    if (newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters' })
      return
    }

    setChangingPassword(true)
    setPasswordMessage(null)

    try {
      const response = await fetch(`/api/users/${user.id}/password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPassword, newPassword }),
      })

      const data = await response.json()

      if (response.ok) {
        setPasswordMessage({ type: 'success', text: data.message || 'Password changed successfully' })
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
      } else {
        setPasswordMessage({ type: 'error', text: data.error || 'Failed to change password' })
      }
    } catch (error) {
      setPasswordMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setChangingPassword(false)
    }
  }

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadge = (role: string) => {
    switch (role) {
      case 'admin':
        return <Badge variant="danger">Admin</Badge>
      case 'professor':
        return <Badge variant="info">Professor</Badge>
      case 'team_leader':
        return <Badge variant="warning">Team Leader</Badge>
      default:
        return <Badge variant="default">Student</Badge>
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Failed to load user data</p>
      </div>
    )
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-card-foreground">Settings</h1>
        <p className="text-muted-foreground mt-1">Manage your account settings and preferences</p>
      </div>

      <div className="grid gap-6 max-w-2xl">
        {/* Avatar Section */}
        <Card>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Profile Picture</h2>

          <div className="flex items-center gap-6">
            <div className="relative">
              {user.avatarUrl ? (
                <Image
                  src={user.avatarUrl}
                  alt={user.fullName}
                  width={96}
                  height={96}
                  className="w-24 h-24 rounded-full object-cover border-4 border-border"
                  unoptimized
                />
              ) : (
                <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center border-4 border-border">
                  <span className="text-2xl font-semibold text-primary">
                    {getInitials(user.fullName)}
                  </span>
                </div>
              )}
              {uploadingAvatar && (
                <div className="absolute inset-0 bg-background/80 rounded-full flex items-center justify-center">
                  <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                </div>
              )}
            </div>

            <div className="flex-1">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/jpeg,image/png,image/gif,image/webp"
                onChange={handleAvatarChange}
                className="hidden"
              />
              <div className="flex gap-2">
                <Button
                  onClick={handleAvatarClick}
                  disabled={uploadingAvatar}
                  variant="secondary"
                >
                  {uploadingAvatar ? 'Uploading...' : 'Change Photo'}
                </Button>
                {user.avatarUrl && (
                  <Button
                    onClick={handleRemoveAvatar}
                    disabled={uploadingAvatar}
                    variant="secondary"
                    className="text-destructive hover:text-destructive"
                  >
                    Remove
                  </Button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                JPEG, PNG, GIF or WebP. Max 5MB.
              </p>
            </div>
          </div>

          {avatarMessage && (
            <div className={`mt-4 p-3 rounded-[0.5rem] ${
              avatarMessage.type === 'success'
                ? 'bg-success/10 text-success'
                : 'bg-destructive/10 text-destructive'
            }`}>
              {avatarMessage.text}
            </div>
          )}
        </Card>

        {/* Profile Information */}
        <Card>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Profile Information</h2>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Email
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="email"
                  value={user.email}
                  onChange={() => {}}
                  disabled
                  className="bg-muted"
                />
                <Badge variant="outline">Cannot change</Badge>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Full Name
              </label>
              <Input
                type="text"
                value={fullName}
                onChange={setFullName}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Role
              </label>
              <div className="flex items-center gap-2">
                {getRoleBadge(user.role)}
                <span className="text-sm text-muted-foreground">
                  Contact an administrator to change your role
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Member Since
              </label>
              <p className="text-muted-foreground">
                {new Date(user.createdAt).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric',
                })}
              </p>
            </div>

            {profileMessage && (
              <div className={`p-3 rounded-[0.5rem] ${
                profileMessage.type === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {profileMessage.text}
              </div>
            )}

            <Button type="submit" disabled={saving || fullName.trim() === user.fullName}>
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
          </form>
        </Card>

        {/* Change Password */}
        <Card>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Change Password</h2>

          <form onSubmit={handleChangePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Current Password
              </label>
              <Input
                type="password"
                value={currentPassword}
                onChange={setCurrentPassword}
                placeholder="Enter your current password"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                New Password
              </label>
              <Input
                type="password"
                value={newPassword}
                onChange={setNewPassword}
                placeholder="Enter new password (min. 6 characters)"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-card-foreground mb-1">
                Confirm New Password
              </label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={setConfirmPassword}
                placeholder="Confirm new password"
                required
              />
            </div>

            {passwordMessage && (
              <div className={`p-3 rounded-[0.5rem] ${
                passwordMessage.type === 'success'
                  ? 'bg-success/10 text-success'
                  : 'bg-destructive/10 text-destructive'
              }`}>
                {passwordMessage.text}
              </div>
            )}

            <Button
              type="submit"
              disabled={changingPassword || !currentPassword || !newPassword || !confirmPassword}
            >
              {changingPassword ? 'Changing Password...' : 'Change Password'}
            </Button>
          </form>
        </Card>

        {/* Account Info */}
        <Card>
          <h2 className="text-lg font-semibold text-card-foreground mb-4">Account Information</h2>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-border">
              <span className="text-muted-foreground">User ID</span>
              <span className="text-card-foreground font-mono text-sm">{user.id}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-muted-foreground">Account Status</span>
              <Badge variant="success">Active</Badge>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
