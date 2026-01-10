import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function GET() {
  try {
    const users = await prisma.user.findMany()
    return NextResponse.json(users)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch users' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { email, fullName, passwordHash } = body

    if (!email || !fullName || !passwordHash) {
      return NextResponse.json(
        { error: 'Email, fullName, and passwordHash are required' },
        { status: 400 }
      )
    }

    const user = await prisma.user.create({
      data: { email, fullName, passwordHash },
    })

    return NextResponse.json(user, { status: 201 })
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create user' },
      { status: 500 }
    )
  }
}
