import { list } from '@vercel/blob'
import { SubmissionCard, type Submission } from '@/components/SubmissionCard'

// ─── Fetch all submissions from Blob ─────────────────────────────────────────

async function getSubmissions(): Promise<(Submission & { blobUrl: string })[]> {
  try {
    const { blobs } = await list({ prefix: 'submissions/' })
    const sorted = blobs.sort((a, b) =>
      new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime()
    )
    const results = await Promise.all(
      sorted.map(async (blob) => {
        const res  = await fetch(blob.url, { cache: 'no-store' })
        const data = await res.json() as Submission
        return { ...data, blobUrl: blob.url }
      })
    )
    return results
  } catch {
    return []
  }
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ key?: string }>
}) {
  const { key } = await searchParams
  const adminKey = process.env.ADMIN_KEY

  // Access check
  if (!adminKey || key !== adminKey) {
    return (
      <html lang="en">
        <head><title>Access Required</title></head>
        <body style={{ margin: 0, background: '#0b0b0c', color: '#c8c4ba', fontFamily: 'monospace', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '100vh' }}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '11px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#5a5650', marginBottom: '24px' }}>K&A Studios · Submissions</div>
            <form method="GET" style={{ display: 'flex', gap: '8px' }}>
              <input
                name="key"
                type="password"
                placeholder="Access key"
                autoFocus
                style={{
                  background: 'transparent', border: '1px solid rgba(236,232,224,0.18)',
                  padding: '10px 16px', color: '#ece8e0', fontFamily: 'monospace',
                  fontSize: '13px', outline: 'none', width: '220px',
                }}
              />
              <button type="submit" style={{
                background: 'none', border: '1px solid rgba(236,232,224,0.18)',
                padding: '10px 20px', color: '#c8c4ba', fontFamily: 'monospace',
                fontSize: '11px', letterSpacing: '0.18em', textTransform: 'uppercase',
                cursor: 'pointer',
              }}>
                Enter
              </button>
            </form>
          </div>
        </body>
      </html>
    )
  }

  const submissions = await getSubmissions()

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Submissions · K&A Studios</title>
        <meta name="robots" content="noindex,nofollow" />
        <style>{`
          @media (max-width: 640px) {
            .grid-2 { grid-template-columns: 1fr !important; }
          }
        `}</style>
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0b0b0c', color: '#c8c4ba', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

        {/* Header */}
        <header style={{
          borderBottom: '1px solid rgba(236,232,224,0.08)',
          padding: '24px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#0b0b0c', zIndex: 10,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8a857d' }}>K&A Studios · Submissions</span>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', color: '#5a5650' }}>
            {submissions.length} {submissions.length === 1 ? 'submission' : 'submissions'}
          </span>
        </header>

        <main style={{ padding: '40px 48px 80px', maxWidth: '1100px' }}>

          {submissions.length === 0 ? (
            <div style={{ paddingTop: '80px', textAlign: 'center', fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5a5650' }}>
              No submissions yet
            </div>
          ) : (
            <>
              {/* Column headers */}
              <div style={{
                display: 'flex', gap: '20px', padding: '0 24px 12px',
                fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.22em',
                textTransform: 'uppercase', color: '#5a5650',
                borderBottom: '1px solid rgba(236,232,224,0.06)', marginBottom: '12px',
              }}>
                <span style={{ minWidth: '28px' }}>#</span>
                <span style={{ flex: 1 }}>Client · Industry · Submitted</span>
                <span style={{ minWidth: '90px' }}>Email</span>
                <span style={{ width: '20px' }} />
              </div>

              {submissions.map((s, i) => (
                <SubmissionCard key={s.blobUrl} s={s} index={i} adminKey={key} />
              ))}
            </>
          )}
        </main>
      </body>
    </html>
  )
}
