import { NextRequest, NextResponse } from 'next/server'
import { connectDB } from '@/lib/db'
import { authenticateRequest } from '@/lib/auth'
import { User } from '@/models/user'
import mongoose from 'mongoose'

export async function GET(req: NextRequest) {
  const user = await authenticateRequest(req)
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(req.url)
  const state = searchParams.get('state')

  if (!state) {
    return NextResponse.json({ error: 'State parameter is required' }, { status: 400 })
  }

  try {
    await connectDB()
    
    // Find all Division HODs for this state
    const allDivisionHODs = await User.find({
      'roles.role': 'Division HOD',
      'roles.state': state
    })
    
    // Extract unique divisions from Division HODs
    const divisionSet = new Set<string>();
    allDivisionHODs.forEach((hod: any) => {
      (hod.roles || []).forEach((role: any) => {
        if (role.role === 'Division HOD' && role.state === state && role.branch) {
          divisionSet.add(role.branch);
        }
      });
    });
    
    const divisions = Array.from(divisionSet).sort();
    
    return NextResponse.json({ divisions })
  } catch (error: any) {
    console.error('Error fetching divisions:', error)
    return NextResponse.json({ error: error.message || 'Failed to fetch divisions' }, { status: 500 })
  }
}
