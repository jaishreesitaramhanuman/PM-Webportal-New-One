import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { User } from '@/models/user'
import { Audit } from '@/models/audit'
import { authenticateRequest, requireRoles, hashPassword } from '@/lib/auth'
import { randomBytes } from 'crypto'

function normalizeName(name: string) {
  return name.trim().replace(/\s+/g, ' ').toLowerCase()
}

async function generateEmailFromName(name: string) {
  const n = normalizeName(name)
  const parts = n.split(' ')
  let base = parts.length >= 2 ? `${parts[0]}.${parts[parts.length - 1]}` : parts[0]
  base = base.replace(/[^a-z0-9.]/g, '')
  let candidate = `${base}@niti.gov.in`
  let idx = 1
  await connectDB()
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const exists = await User.findOne({ email: candidate })
    if (!exists) return candidate
    idx += 1
    candidate = `${base}${idx}@niti.gov.in`
  }
}

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!requireRoles(user, ['Super Admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Not implemented in demo mode' }, { status: 501 })
  }
  await connectDB()
  const users = await User.find().lean()
  return NextResponse.json({
    users: users.map((u: any) => ({
      id: String(u._id),
      name: u.name,
      email: u.email,
      roles: (u.roles || []).map((r: any) => ({ role: r.role, state: r.state, division: r.branch })),
      avatarUrl: u.avatarUrl || 'https://picsum.photos/seed/100/100',
      status: u.status || 'active',
    })),
  })
}

export async function POST(req: NextRequest) {
  const actor = await authenticateRequest(req)
  if (!requireRoles(actor, ['Super Admin'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const body = await req.json().catch(() => ({}))
  const name = String(body?.name || '').trim()
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 })
  if (!process.env.MONGODB_URI) {
    return NextResponse.json({ error: 'Not implemented in demo mode' }, { status: 501 })
  }
  await connectDB()
  const email = await generateEmailFromName(name)
  const temp = randomBytes(9).toString('base64').replace(/[^a-zA-Z0-9]/g, '').slice(0, 10)
  const passwordHash = await hashPassword(temp)
  const created = await User.create({ name, email, passwordHash, roles: [], status: 'pending' })
  await Audit.create({ action: 'User Created', actorId: actor!._id, targetUserId: created._id, notes: `Email ${email}` })
  return NextResponse.json({
    user: {
      id: String(created._id),
      name: created.name,
      email: created.email,
      roles: [],
      avatarUrl: created.avatarUrl || 'https://picsum.photos/seed/100/100',
      status: created.status || 'pending',
    },
    tempPassword: temp,
  })
}