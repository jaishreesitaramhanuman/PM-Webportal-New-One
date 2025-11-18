import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/lib/auth'

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) return NextResponse.json({ user: null }, { status: 401 })
  return NextResponse.json({
    user: {
      id: String(user._id),
      name: user.name,
      email: user.email,
      roles: (user.roles || []).map((r: any) => ({ role: r.role, state: r.state, division: r.branch })),
      avatarUrl: user.avatarUrl || 'https://picsum.photos/seed/100/100',
    },
  })
}