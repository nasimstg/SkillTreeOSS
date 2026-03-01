import { NextRequest, NextResponse } from 'next/server'
import { existsSync } from 'fs'
import { join } from 'path'

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params

  // Validate id to prevent path traversal
  if (!/^[a-z0-9-]+$/.test(id)) {
    return NextResponse.json({ exists: false })
  }

  const treePath = join(process.cwd(), 'data', 'trees', `${id}.json`)
  const exists   = existsSync(treePath)

  return NextResponse.json({ exists })
}
