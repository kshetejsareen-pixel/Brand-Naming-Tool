import { list } from '@vercel/blob'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Submission {
  submittedAt: string
  briefUrl: string
  emailStatus: 'sent' | 'failed'
  answers: Record<string, string | string[]>
}

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

// ─── Label helpers ────────────────────────────────────────────────────────────

function fmtDate(iso: string) {
  return new Date(iso).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  })
}

function val(v: string | string[] | undefined): string {
  if (!v) return '—'
  return Array.isArray(v) ? v.join(', ') : v
}

// ─── Row component ────────────────────────────────────────────────────────────

function SubmissionCard({ s, index }: { s: Submission & { blobUrl: string }; index: number }) {
  const a = s.answers
  const emailFailed = s.emailStatus === 'failed'

  return (
    <details style={{
      border: '1px solid rgba(236,232,224,0.10)',
      marginBottom: '12px',
      background: 'rgba(236,232,224,0.02)',
    }}>
      <summary style={{
        padding: '20px 24px',
        cursor: 'pointer',
        listStyle: 'none',
        display: 'flex',
        alignItems: 'center',
        gap: '20px',
        userSelect: 'none',
      }}>
        {/* Index */}
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5650', minWidth: '28px' }}>
          #{index + 1}
        </span>

        {/* Name + business */}
        <span style={{ flex: 1 }}>
          <span style={{ fontSize: '15px', color: '#ece8e0' }}>
            {val(a.client_name)}
          </span>
          {a.business_name && (
            <span style={{ fontSize: '13px', color: '#8a857d', marginLeft: '10px' }}>
              {val(a.business_name)}
            </span>
          )}
        </span>

        {/* Industry */}
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b6460', letterSpacing: '0.12em', textTransform: 'uppercase', minWidth: '140px' }}>
          {val(a.industry)}
        </span>

        {/* Date */}
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b6460', minWidth: '160px' }}>
          {fmtDate(s.submittedAt)}
        </span>

        {/* Email status */}
        <span style={{
          fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.16em',
          textTransform: 'uppercase', padding: '3px 8px',
          border: `1px solid ${emailFailed ? 'rgba(255,100,100,0.3)' : 'rgba(100,200,100,0.3)'}`,
          color: emailFailed ? 'rgba(255,130,130,0.8)' : 'rgba(130,200,130,0.8)',
        }}>
          {emailFailed ? 'email failed' : 'email sent'}
        </span>

        {/* Expand arrow */}
        <span style={{ color: '#5a5650', fontSize: '12px' }}>▸</span>
      </summary>

      {/* Expanded content */}
      <div style={{ padding: '0 24px 28px', borderTop: '1px solid rgba(236,232,224,0.06)', marginTop: '0' }}>

        {/* Brief URL */}
        <div style={{ paddingTop: '20px', marginBottom: '24px' }}>
          <a href={s.briefUrl} target="_blank" rel="noopener noreferrer" style={{
            display: 'inline-flex', alignItems: 'center', gap: '8px',
            fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.18em',
            textTransform: 'uppercase', color: '#c8c4ba',
            border: '1px solid rgba(236,232,224,0.18)',
            padding: '10px 18px', textDecoration: 'none',
          }}>
            Open Brief ↗
          </a>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '32px' }}>

          {/* Left column */}
          <div>
            <Module label="01 — The Business">
              <Row k="What it does"      v={val(a.what_it_does)} />
              <Row k="Customer"          v={val(a.who_is_customer)} />
              <Row k="Core belief"       v={val(a.belief)} />
              <Row k="Competitors"       v={val(a.competitors)} />
              <Row k="Admired name"      v={val(a.admired_name)} />
            </Module>

            <Module label="02 — Personality">
              <Row k="Room presence"     v={val(a.room_entry)} />
              <Row k="Must never be"     v={val(a.worst_when)} />
              <Row k="Archetype"         v={val(a.archetype_person)} />
              <Row k="Legendary for"     v={val(a.legendary_for)} />
            </Module>

            <Module label="06 — Free Mind">
              <Row k="Seven words"       v={val(a.seven_words)} />
            </Module>
          </div>

          {/* Right column */}
          <div>
            <Module label="03 — Sound">
              <Row k="Kova / Stryx"      v={val(a.sound_1)} />
              <Row k="Luma / Drak"       v={val(a.sound_2)} />
              <Row k="Nevo / Krix"       v={val(a.sound_3)} />
              <Row k="Aela / Vort"       v={val(a.sound_4)} />
              <Row k="Veda / Flux"       v={val(a.sound_5)} />
            </Module>

            <Module label="04 — Feeling">
              <Row k="Before discovery"  v={val(a.before_feeling)} />
              <Row k="First encounter"   v={val(a.first_encounter)} />
              <Row k="Sensory"           v={val(a.sensory)} />
            </Module>

            <Module label="05 — Constraints">
              <Row k="Naming type"       v={val(a.naming_type)} />
              <Row k="Domain"            v={val(a.domain_required)} />
              <Row k="Language"          v={val(a.language)} />
              <Row k="Syllables"         v={val(a.syllables)} />
            </Module>
          </div>
        </div>
      </div>
    </details>
  )
}

function Module({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: '24px' }}>
      <div style={{
        fontFamily: 'monospace', fontSize: '9px', letterSpacing: '0.28em',
        textTransform: 'uppercase', color: '#5a5650',
        borderBottom: '1px solid rgba(236,232,224,0.06)',
        paddingBottom: '8px', marginBottom: '12px',
      }}>{label}</div>
      {children}
    </div>
  )
}

function Row({ k, v }: { k: string; v: string }) {
  if (!v || v === '—') return null
  return (
    <div style={{ marginBottom: '10px', display: 'grid', gridTemplateColumns: '120px 1fr', gap: '12px' }}>
      <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5650', textTransform: 'uppercase', letterSpacing: '0.1em', paddingTop: '2px' }}>{k}</span>
      <span style={{ fontSize: '13px', color: '#c8c4ba', lineHeight: '1.6' }}>{v}</span>
    </div>
  )
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
          details[open] summary span:last-child { transform: rotate(90deg); display: inline-block; }
          summary::-webkit-details-marker { display: none; }
          @media (max-width: 640px) {
            .grid-2 { grid-template-columns: 1fr !important; }
            .hide-mobile { display: none !important; }
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
                <span style={{ flex: 1 }}>Client</span>
                <span className="hide-mobile" style={{ minWidth: '140px' }}>Industry</span>
                <span className="hide-mobile" style={{ minWidth: '160px' }}>Submitted</span>
                <span style={{ minWidth: '90px' }}>Email</span>
                <span style={{ width: '20px' }} />
              </div>

              {submissions.map((s, i) => (
                <SubmissionCard key={s.blobUrl} s={s} index={i} />
              ))}
            </>
          )}
        </main>
      </body>
    </html>
  )
}
