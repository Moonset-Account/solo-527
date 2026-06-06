import { NextResponse } from 'next/server'
import { createDamageRecord, resolveDamageRecord } from '@/lib/order-service'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const damageRecord = await createDamageRecord(body)
    return NextResponse.json(damageRecord)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const id = searchParams.get('id')
    
    if (!id) {
      return NextResponse.json(
        { error: 'Missing damage record id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const damageRecord = await resolveDamageRecord(
      id,
      body.resolvedBy,
      body.resolutionNotes
    )
    return NextResponse.json(damageRecord)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
