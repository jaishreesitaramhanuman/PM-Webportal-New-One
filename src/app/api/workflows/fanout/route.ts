import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { authenticateRequest, requireRoles } from '@/lib/auth'
import { WorkflowRequest } from '@/models/request'

export async function POST(req: NextRequest) {
  const actor = await authenticateRequest(req)
  if (!requireRoles(actor, ['State YP'])) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  const Schema = z.object({ requestId: z.string(), state: z.string(), divisions: z.array(z.string()).min(1) })
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  await connectDB()
  const reqDoc = await WorkflowRequest.findById(parsed.data.requestId)
  if (!reqDoc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const set = new Set([...(reqDoc.targets?.branches || []), ...parsed.data.divisions])
  reqDoc.targets = reqDoc.targets || { states: [], branches: [], domains: [] }
  reqDoc.targets.branches = Array.from(set)
  reqDoc.history.push({ action: 'fanout', userId: actor!._id, timestamp: new Date(), notes: `${parsed.data.state}` })
  await reqDoc.save()
  return NextResponse.json({ ok: true, branches: reqDoc.targets.branches })
}