import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { uploadContract, signContract, getContractUrl } from '@/lib/storage-service'

export async function POST(request: Request) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const orderId = formData.get('orderId') as string
    const uploadedBy = formData.get('uploadedBy') as string

    if (!file || !orderId || !uploadedBy) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const contract = await uploadContract(orderId, file, uploadedBy)
    return NextResponse.json(contract)
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
        { error: 'Missing contract id' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const contract = await signContract(id, body.signedBy)
    return NextResponse.json(contract)
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const filePath = searchParams.get('filePath')
    
    if (!filePath) {
      return NextResponse.json(
        { error: 'Missing file path' },
        { status: 400 }
      )
    }

    const url = await getContractUrl(filePath)
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}
