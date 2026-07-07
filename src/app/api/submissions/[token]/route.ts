import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { type ProjectState, DEFAULT_PROJECT, isValidToken } from '@/lib/project'

function checkAdminKey(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  return !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY
}

export async function PATCH(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!checkAdminKey(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { token } = await params
  if (!isValidToken(token)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const patch = await req.json() as Partial<ProjectState>

    const { blobs } = await list({ prefix: `submissions/${token}.json` })
    const blob = blobs[0]
    if (!blob) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }

    const res = await fetch(blob.url, { cache: 'no-store' })
    const data = await res.json()

    const project: ProjectState = { ...DEFAULT_PROJECT, ...data.project, ...patch }
    const updated = { ...data, project }

    await put(`submissions/${token}.json`, JSON.stringify(updated, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return NextResponse.json({ ok: true, project })
  } catch (err) {
    console.error('Project update failed:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
