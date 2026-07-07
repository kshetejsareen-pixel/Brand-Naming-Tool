import { NextRequest, NextResponse } from 'next/server'
import { list, put } from '@vercel/blob'
import { type Answers } from '@/lib/schema'
import { type ProjectState, DEFAULT_PROJECT, isValidToken } from '@/lib/project'
import { generateNamingDirections } from '@/lib/naming'

function checkAdminKey(req: NextRequest): boolean {
  const key = req.headers.get('x-admin-key')
  return !!process.env.ADMIN_KEY && key === process.env.ADMIN_KEY
}

// Generates another batch of naming territories for an existing submission —
// same diagnostic, told explicitly which names are already on the table so
// it explores new ground instead of re-rolling near-duplicates. Appends as
// additional territories rather than replacing what's already there.
export async function POST(req: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  if (!checkAdminKey(req)) {
    return NextResponse.json({ ok: false }, { status: 401 })
  }

  const { token } = await params
  if (!isValidToken(token)) {
    return NextResponse.json({ ok: false }, { status: 400 })
  }

  try {
    const { steeringNote } = await req.json() as { steeringNote?: string }

    const { blobs } = await list({ prefix: `submissions/${token}.json` })
    const blob = blobs[0]
    if (!blob) {
      return NextResponse.json({ ok: false }, { status: 404 })
    }

    const res = await fetch(blob.url, { cache: 'no-store' })
    const data = await res.json()
    const answers = data.answers as Answers
    const project: ProjectState = { ...DEFAULT_PROJECT, ...data.project }

    const existingNames = project.territories.flatMap((t) => t.names.map((n) => n.name))
    const result = await generateNamingDirections(answers, { existingNames, steeringNote })

    if (!result) {
      return NextResponse.json({ ok: false, error: 'Generation failed or ANTHROPIC_API_KEY not configured' }, { status: 502 })
    }

    const updatedProject: ProjectState = {
      ...project,
      status: project.status === 'new' ? 'generated' : project.status,
      brandCharacter: project.brandCharacter ?? result.brandCharacter,
      territories: [...project.territories, ...result.territories],
    }

    await put(`submissions/${token}.json`, JSON.stringify({ ...data, project: updatedProject }, null, 2), {
      access: 'public',
      addRandomSuffix: false,
      allowOverwrite: true,
    })

    return NextResponse.json({ ok: true, project: updatedProject })
  } catch (err) {
    console.error('Generate more names failed:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
