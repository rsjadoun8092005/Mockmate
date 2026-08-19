import { NextRequest, NextResponse } from 'next/server'
import pdfParse from 'pdf-parse'

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData()
    const file = formData.get('resume') as File | null

    if (!file) {
      return NextResponse.json({ error: 'No resume file provided' }, { status: 400 })
    }

    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)
    
    // Parse the PDF
    const data = await pdfParse(buffer)
    
    return NextResponse.json({ text: data.text })
  } catch (error) {
    console.error('Error parsing resume:', error)
    return NextResponse.json({ error: 'Failed to parse resume' }, { status: 500 })
  }
}
