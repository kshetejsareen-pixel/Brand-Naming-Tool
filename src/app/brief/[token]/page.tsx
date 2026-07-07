import { notFound } from 'next/navigation'
import { list } from '@vercel/blob'
import { type Answers, SCREENS_BY_ID, formatAnswer, phonosemanticProfile } from '@/lib/schema'
import { isValidToken } from '@/lib/project'

interface BriefData {
  answers: Answers
  submittedAt: string
}

// The token addresses a Blob record rather than encoding the answers itself —
// a base64 dump of the full diagnostic in the URL had no expiry and no auth.
async function loadSubmission(token: string): Promise<BriefData | null> {
  if (!isValidToken(token)) return null
  try {
    const { blobs } = await list({ prefix: `submissions/${token}.json` })
    const blob = blobs[0]
    if (!blob) return null
    const res = await fetch(blob.url, { cache: 'no-store' })
    if (!res.ok) return null
    const data = await res.json()
    return { answers: data.answers, submittedAt: data.submittedAt }
  } catch {
    return null
  }
}

// ─── Section component ────────────────────────────────────────────────────────

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: '56px' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: '16px',
        borderBottom: '1px solid rgba(236,232,224,0.08)',
        paddingBottom: '12px', marginBottom: '28px',
      }}>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', color: '#6b6460', textTransform: 'uppercase' }}>{num}</span>
        <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#8a857d', textTransform: 'uppercase' }}>{title}</span>
      </div>
      {children}
    </section>
  )
}

function Field({ label, value }: { label: string; value: string }) {
  if (!value || value === '—') return null
  return (
    <div style={{ marginBottom: '20px' }}>
      <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', color: '#6b6460', textTransform: 'uppercase', marginBottom: '6px' }}>{label}</div>
      <div style={{ fontSize: '15px', color: '#c8c4ba', lineHeight: '1.7', whiteSpace: 'pre-wrap' }}>{value}</div>
    </div>
  )
}

// Renders a question's answer using the shared schema — the label shown here
// always matches the label shown in the email / Claude doc / admin view,
// because all four read from the same src/lib/schema.ts definitions.
function AnswerField({ id, a }: { id: string; a: Answers }) {
  const screen = SCREENS_BY_ID[id]
  return <Field label={screen.briefLabel} value={formatAnswer(id, a[id])} />
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = await loadSubmission(token)
  if (!data) notFound()

  const { answers: a, submittedAt } = data
  const sonic = phonosemanticProfile(a)

  const date = new Date(submittedAt).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })

  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <title>Brand Brief · {String(a.business_name || a.client_name || 'K&A Studios')}</title>
        <meta name="robots" content="noindex,nofollow" />
      </head>
      <body style={{ margin: 0, padding: 0, background: '#0b0b0c', color: '#c8c4ba', fontFamily: "'Inter', system-ui, sans-serif", WebkitFontSmoothing: 'antialiased' }}>

        {/* Header */}
        <header style={{
          borderBottom: '1px solid rgba(236,232,224,0.08)',
          padding: '28px 48px',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, background: '#0b0b0c', zIndex: 10,
        }}>
          <span style={{ fontFamily: 'monospace', fontSize: '11px', letterSpacing: '0.28em', textTransform: 'uppercase', color: '#8a857d' }}>K&A Studios</span>
          <span style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#5a5650' }}>Brand Brief · Confidential</span>
        </header>

        {/* Hero */}
        <div style={{ padding: '64px 48px 48px', borderBottom: '1px solid rgba(236,232,224,0.06)', maxWidth: '800px' }}>
          <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.3em', textTransform: 'uppercase', color: '#6b6460', marginBottom: '16px' }}>Brand Naming Diagnostic</div>
          <h1 style={{
            fontFamily: "'Cormorant Garamond', Georgia, serif",
            fontWeight: 400, fontSize: 'clamp(36px, 5vw, 64px)',
            lineHeight: 1.05, letterSpacing: '-0.02em',
            color: '#ece8e0', margin: '0 0 12px',
          }}>
            {String(a.business_name || 'Unnamed Project')}
          </h1>
          <div style={{ fontSize: '14px', color: '#8a857d' }}>
            {String(a.client_name || '—')} · {String(a.industry || '—')} · Submitted {date}
          </div>
        </div>

        {/* Body */}
        <main style={{ maxWidth: '800px', padding: '56px 48px 96px' }}>

          {/* Inferred brand character */}
          <Section num="—" title="Inferred Brand Character">
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '8px',
            }}>
              {/* Sonic */}
              <div style={{ border: '1px solid rgba(236,232,224,0.10)', padding: '24px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6460', marginBottom: '12px' }}>Sonic register</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontStyle: 'italic', color: '#ece8e0', marginBottom: '8px' }}>{sonic.label}</div>
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6b6460' }}>{sonic.score}/{sonic.total} soft phoneme preference</div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#8a857d', lineHeight: 1.6 }}>{formatAnswer('cultural_register', a.cultural_register)}</div>
              </div>
              {/* Archetype */}
              <div style={{ border: '1px solid rgba(236,232,224,0.10)', padding: '24px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6460', marginBottom: '12px' }}>Primary archetype</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontStyle: 'italic', color: '#ece8e0', marginBottom: '8px' }}>{formatAnswer('archetype_person', a.archetype_person)}</div>
                <div style={{ fontSize: '12px', color: '#8a857d', marginTop: '12px', lineHeight: 1.6 }}>
                  <div>Presence: {formatAnswer('room_entry', a.room_entry)}</div>
                  <div style={{ marginTop: '4px' }}>Acceptable flaw: {formatAnswer('acceptable_flaw', a.acceptable_flaw)}</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Module 01 */}
          <Section num="01" title="The Business">
            <AnswerField id="what_it_does" a={a} />
            <AnswerField id="who_is_customer" a={a} />
            <AnswerField id="belief" a={a} />
            <AnswerField id="competitors" a={a} />
            <AnswerField id="admired_name" a={a} />
            <AnswerField id="price_tier" a={a} />
          </Section>

          {/* Module 02 */}
          <Section num="02" title="Personality">
            <AnswerField id="room_entry" a={a} />
            <AnswerField id="acceptable_flaw" a={a} />
            <AnswerField id="archetype_person" a={a} />
            <AnswerField id="legendary_for" a={a} />
          </Section>

          {/* Module 03 */}
          <Section num="03" title="Sound & Culture">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {['sound_1', 'sound_2', 'sound_3', 'sound_4'].map((id) => (
                <div key={id} style={{ border: '1px solid rgba(236,232,224,0.08)', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5650', marginBottom: '6px' }}>{SCREENS_BY_ID[id].briefLabel}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontStyle: 'italic', color: '#ece8e0' }}>{formatAnswer(id, a[id])}</div>
                </div>
              ))}
            </div>
            <Field label="Sonic profile" value={`${sonic.label} (${sonic.score}/${sonic.total})`} />
            <AnswerField id="market_scope" a={a} />
            <AnswerField id="cultural_register" a={a} />
          </Section>

          {/* Module 04 */}
          <Section num="04" title="Feeling">
            <AnswerField id="before_feeling" a={a} />
            <AnswerField id="first_encounter" a={a} />
            <AnswerField id="sensory" a={a} />
          </Section>

          {/* Module 05 */}
          <Section num="05" title="Constraints">
            <AnswerField id="naming_type" a={a} />
            <AnswerField id="naming_stance" a={a} />
            <AnswerField id="domain_required" a={a} />
            <AnswerField id="language" a={a} />
            <AnswerField id="syllables" a={a} />
            <AnswerField id="off_limits" a={a} />
          </Section>

          {/* Module 06 */}
          <Section num="06" title="Free Association">
            <AnswerField id="seven_words" a={a} />
          </Section>

          {/* Footer note */}
          <div style={{
            borderTop: '1px solid rgba(236,232,224,0.06)',
            paddingTop: '32px',
            fontFamily: 'monospace', fontSize: '10px',
            letterSpacing: '0.16em', textTransform: 'uppercase',
            color: '#5a5650', lineHeight: 2,
          }}>
            K&A Studios · Brand Naming Diagnostic · Internal Reference<br />
            Naming directions generated by Claude are in the email report.<br />
            To continue into Phase 2, upload the brief document from that email to Claude.
          </div>
        </main>
      </body>
    </html>
  )
}
