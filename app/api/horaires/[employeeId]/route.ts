import { NextRequest, NextResponse } from 'next/server'
import { kv } from '@vercel/kv'

interface DaySchedule {
  open: string
  close: string
  closed: boolean
  lunch?: {
    start: string
    end: string
  } | null
}

interface WeekSchedule {
  tz: string
  week: {
    mon: DaySchedule
    tue: DaySchedule
    wed: DaySchedule
    thu: DaySchedule
    fri: DaySchedule
    sat: DaySchedule
    sun: DaySchedule
  }
}

const DEFAULT_SCHEDULE: WeekSchedule = {
  tz: 'Europe/Paris',
  week: {
    mon: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    tue: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    wed: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    thu: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    fri: { open: '09:00', close: '19:00', closed: false, lunch: { start: '12:30', end: '13:30' } },
    sat: { open: '09:00', close: '19:00', closed: false, lunch: null },
    sun: { open: '09:00', close: '19:00', closed: true, lunch: null }
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const passcode = request.headers.get('x-passcode')
    if (!passcode || passcode !== '1234') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Try to get schedule from KV
    const key = `schedule:${employeeId}`
    const schedule = await kv.get<WeekSchedule>(key)

    if (!schedule) {
      // Return default schedule if none exists
      return NextResponse.json(DEFAULT_SCHEDULE)
    }

    return NextResponse.json(schedule)
  } catch (error) {
    console.error('Error fetching schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const passcode = request.headers.get('x-passcode')
    if (!passcode || passcode !== '1234') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    const body = await request.json()
    
    // Validate schedule structure
    if (!body.week || !body.tz) {
      return NextResponse.json({ error: 'Invalid schedule format' }, { status: 400 })
    }

    // Validate each day
    const days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    for (const day of days) {
      const daySchedule = body.week[day]
      if (!daySchedule || typeof daySchedule.closed !== 'boolean') {
        return NextResponse.json({ error: `Invalid schedule for ${day}` }, { status: 400 })
      }

      if (!daySchedule.closed) {
        if (!daySchedule.open || !daySchedule.close) {
          return NextResponse.json({ error: `Missing open/close times for ${day}` }, { status: 400 })
        }

        // Validate time format (HH:MM)
        const timeRegex = /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/
        if (!timeRegex.test(daySchedule.open) || !timeRegex.test(daySchedule.close)) {
          return NextResponse.json({ error: `Invalid time format for ${day}` }, { status: 400 })
        }

        // Validate lunch break if present
        if (daySchedule.lunch) {
          if (!daySchedule.lunch.start || !daySchedule.lunch.end) {
            return NextResponse.json({ error: `Invalid lunch break for ${day}` }, { status: 400 })
          }
          if (!timeRegex.test(daySchedule.lunch.start) || !timeRegex.test(daySchedule.lunch.end)) {
            return NextResponse.json({ error: `Invalid lunch time format for ${day}` }, { status: 400 })
          }
        }
      }
    }

    // Save to KV
    const key = `schedule:${employeeId}`
    await kv.set(key, body)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error saving schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { employeeId: string } }
) {
  try {
    const passcode = request.headers.get('x-passcode')
    if (!passcode || passcode !== '1234') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { employeeId } = params
    if (!employeeId) {
      return NextResponse.json({ error: 'Employee ID required' }, { status: 400 })
    }

    // Delete from KV
    const key = `schedule:${employeeId}`
    await kv.del(key)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting schedule:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
