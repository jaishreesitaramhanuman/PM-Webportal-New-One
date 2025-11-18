import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { authenticateRequest, requireRoles } from '@/lib/auth'
import { WorkflowRequest } from '@/models/request'
import { User } from '@/models/user'

const TransitionMap: Record<string, string[]> = {
  'PMO Viewer': ['CEO NITI'],
  'CEO NITI': ['State Advisor'],
  'State Advisor': ['State YP'],
  'State YP': ['Division HOD'],
  'Division HOD': ['Division YP'],
}

export async function POST(req: NextRequest) {
  const actor = await authenticateRequest(req)
  if (!actor) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const Schema = z.object({ requestId: z.string(), toRole: z.string(), state: z.string().optional(), division: z.string().optional(), revisedDeadline: z.string().optional() })
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  const toRole = parsed.data.toRole
  const actorRoles = (actor.roles || []).map((r: any) => r.role)
  const canForward = actorRoles.some((r) => (TransitionMap[r] || []).includes(toRole))
  if (!canForward) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  await connectDB()
  const reqDoc = await WorkflowRequest.findById(parsed.data.requestId)
  if (!reqDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const query: any = { 'roles.role': toRole }
  if (parsed.data.state) query['roles.state'] = parsed.data.state
  if (parsed.data.division) query['roles.branch'] = parsed.data.division
  const target = await User.findOne(query)
  if (!target) return NextResponse.json({ error: 'No target user for role/context' }, { status: 404 })
  if (parsed.data.revisedDeadline) {
    const d = new Date(parsed.data.revisedDeadline)
    reqDoc.deadline = d
  }
  reqDoc.currentAssigneeId = target._id
  reqDoc.history.push({ action: 'forward', userId: actor._id, timestamp: new Date(), notes: `${toRole}` })
  await reqDoc.save()
  return NextResponse.json({ ok: true, assigneeId: String(target._id) })
}