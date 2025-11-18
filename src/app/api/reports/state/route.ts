import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { connectDB } from '@/lib/db'
import { authenticateRequest, requireRoles } from '@/lib/auth'
import { FormSubmission } from '@/models/form'
import { StateReport } from '@/models/stateReport'
import { mergeForms, MergeStrategy } from '@/lib/mergeEngine'

export async function POST(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!requireRoles(user, ['State YP'])) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }
  const Schema = z.object({ requestId: z.string(), state: z.string(), childFormIds: z.array(z.string()).min(1), strategy: z.record(z.enum(['sum', 'avg', 'max', 'min', 'concat'])) })
  const body = await req.json()
  const parsed = Schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: parsed.error.format() }, { status: 400 })
  await connectDB()
  const children = await FormSubmission.find({ _id: { $in: parsed.data.childFormIds } })
  const compiled = mergeForms(children, parsed.data.strategy as MergeStrategy)
  const report = await StateReport.create({ requestId: parsed.data.requestId, state: parsed.data.state, divisionFormIds: parsed.data.childFormIds, compiledData: compiled, createdBy: user!._id, audit: [{ action: 'compiled', userId: user!._id, ts: new Date() }] })
  return NextResponse.json({ id: String(report._id) })
}