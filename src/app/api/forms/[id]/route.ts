import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { authenticateRequest, requireRoles } from '@/lib/auth'
import { FormSubmission } from '@/models/form'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await authenticateRequest(req)
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const Schema = z.object({ action: z.enum(['approve', 'reject']), notes: z.string().optional() })
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  const id = params.id
  await connectDB()
  const doc = await FormSubmission.findById(id)
  if (!doc) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const canApprove = requireRoles(user, ['Division HOD', 'State YP', 'State Advisor', 'CEO NITI'])
  if (!canApprove) return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  doc.status = parsed.data.action === 'approve' ? 'approved' : 'rejected'
  doc.audit.push({ action: parsed.data.action, userId: user._id, ts: new Date(), notes: parsed.data.notes })
  await doc.save()
  return NextResponse.json({ ok: true })
}