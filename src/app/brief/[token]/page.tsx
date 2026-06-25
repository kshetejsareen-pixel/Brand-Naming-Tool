import { notFound } from 'next/navigation'

interface BriefData {
  answers: Record<string, string | string[]>
  submittedAt: string
}

function decode(token: string): BriefData | null {
  try {
    const padded = token.replace(/-/g, '+').replace(/_/g, '/').padEnd(
      token.length + (4 - (token.length % 4)) % 4, '='
    )
    const json = Buffer.from(padded, 'base64').toString('utf8')
    return JSON.parse(json)
  } catch {
    return null
  }
}

function phonosemanticProfile(a: Record<string, string | string[]>): { score: number; label: string; detail: string } {
  const soft = ['Kova', 'Luma', 'Nevo', 'Aela']
  const choices = [a.sound_1, a.sound_2, a.sound_3, a.sound_4].map((v) => String(v || ''))
  const score = choices.filter((v) => soft.includes(v)).length

  const axes = [
    { pair: ['Kova', 'Stryx'], desc: 'approachable ↔ sharp' },
    { pair: ['Luma', 'Drak'],  desc: 'luminous ↔ dark' },
    { pair: ['Nevo', 'Krix'],  desc: 'fluid ↔ structured' },
    { pair: ['Aela', 'Vort'],  desc: 'lyrical ↔ direct' },
  ]
  const detail = axes.map((ax, i) => `${ax.desc}: ${choices[i] || '—'}`).join(' · ')

  let label = 'Balanced'
  if (score >= 3) label = 'Soft / warm'
  if (score <= 1) label = 'Hard / precise'

  return { score, label, detail }
}

function archetypeLabel(val: string): string {
  const map: Record<string, string> = {
    craftsperson: 'The Master Craftsperson',
    guide:        'The Experienced Guide',
    visionary:    'The Visionary',
    rebel:        'The Rebel',
    caregiver:    'The Caregiver',
    ruler:        'The Ruler',
  }
  return map[val] || val
}

function presenceLabel(val: string): string {
  const map: Record<string, string> = {
    quiet_confident:    'Quietly — then everyone is drawn to it',
    warm_host:          'With warmth — makes the room feel welcoming',
    impossible_miss:    'Boldly — impossible to miss',
    best_conversation:  'Slowly — but has the most interesting thing to say',
  }
  return map[val] || val
}

function antiValueLabel(val: string): string {
  const map: Record<string, string> = {
    people_pleasing: 'Trying too hard to please everyone',
    cold:            'Cold and transactional',
    complicated:     'Overcomplicated and hard to understand',
    generic:         'Generic — indistinguishable from everything else',
  }
  return map[val] || val
}

function firstEncounterLabel(val: string): string {
  const map: Record<string, string> = {
    recognition: 'Instant recognition — this is for me',
    curiosity:   'Curiosity — I need to know more',
    trust:       "Trust — these people know what they're doing",
    aspiration:  'Aspiration — I want to be associated with this',
  }
  return map[val] || val
}

function sensoryLabel(val: string): string {
  const map: Record<string, string> = {
    cedar_leather: 'Cedar and leather — classic, grounded',
    fresh_linen:   'Fresh linen — clean, honest, precise',
    warm_vanilla:  'Warm vanilla — nurturing, familiar',
    sea_air:       'Sea air — free, expansive',
    dark_coffee:   'Dark coffee — focused, intense',
    green_herb:    'Green herb — natural, purposeful',
  }
  return map[val] || val
}

function syllableLabel(val: string): string {
  const map: Record<string, string> = {
    '1':    'One syllable',
    '2':    'Two syllables',
    '3_4':  'Three or four syllables',
    open:   'No preference',
  }
  return map[val] || val
}

function namingTypeLabel(val: string): string {
  const map: Record<string, string> = {
    invented:  'Invented — a word that didn\'t exist before',
    real_word: 'Real word — borrows existing meaning',
    compound:  'Blend / compound — two ideas joined',
    no_pref:   'No preference — best name wins',
  }
  return map[val] || val
}

function domainLabel(val: string): string {
  const map: Record<string, string> = {
    hard_yes:        'Critical — exact .com must be available',
    preferred:       'Preferred but flexible — .co or .in works',
    not_a_priority:  'Not a priority right now',
  }
  return map[val] || val
}

function languageLabel(val: string | string[]): string {
  const map: Record<string, string> = {
    english: 'English',
    hindi:   'Hindi',
    both:    'English + Hindi',
    other:   'Other',
  }
  const arr = Array.isArray(val) ? val : [val]
  return arr.map((v) => map[v] || v).join(', ')
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function BriefPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  const data = decode(token)
  if (!data) notFound()

  const { answers, submittedAt } = data
  const a = answers
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
                <div style={{ fontFamily: 'monospace', fontSize: '11px', color: '#6b6460' }}>{sonic.score}/4 soft phoneme preference</div>
                <div style={{ marginTop: '12px', fontSize: '12px', color: '#8a857d', lineHeight: 1.6 }}>{sonic.detail}</div>
              </div>
              {/* Archetype */}
              <div style={{ border: '1px solid rgba(236,232,224,0.10)', padding: '24px' }}>
                <div style={{ fontFamily: 'monospace', fontSize: '10px', letterSpacing: '0.2em', textTransform: 'uppercase', color: '#6b6460', marginBottom: '12px' }}>Primary archetype</div>
                <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '28px', fontStyle: 'italic', color: '#ece8e0', marginBottom: '8px' }}>{archetypeLabel(String(a.archetype_person || ''))}</div>
                <div style={{ fontSize: '12px', color: '#8a857d', marginTop: '12px', lineHeight: 1.6 }}>
                  <div>Presence: {presenceLabel(String(a.room_entry || ''))}</div>
                  <div style={{ marginTop: '4px' }}>Anti-value: {antiValueLabel(String(a.worst_when || ''))}</div>
                </div>
              </div>
            </div>
          </Section>

          {/* Module 01 */}
          <Section num="01" title="The Business">
            <Field label="What it does" value={String(a.what_it_does || '—')} />
            <Field label="Who the customer is" value={String(a.who_is_customer || '—')} />
            <Field label="Core belief" value={String(a.belief || '—')} />
            <Field label="Competitors" value={String(a.competitors || '—')} />
            <Field label="Admired name" value={String(a.admired_name || '—')} />
          </Section>

          {/* Module 02 */}
          <Section num="02" title="Personality">
            <Field label="Room presence" value={presenceLabel(String(a.room_entry || ''))} />
            <Field label="Anti-value (must never be)" value={antiValueLabel(String(a.worst_when || ''))} />
            <Field label="Archetype" value={archetypeLabel(String(a.archetype_person || ''))} />
            <Field label="Legendary for (10-year vision)" value={String(a.legendary_for || '—')} />
          </Section>

          {/* Module 03 */}
          <Section num="03" title="Sound">
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '20px' }}>
              {[
                { pair: 'Kova / Stryx', chosen: String(a.sound_1 || '—') },
                { pair: 'Luma / Drak',  chosen: String(a.sound_2 || '—') },
                { pair: 'Nevo / Krix',  chosen: String(a.sound_3 || '—') },
                { pair: 'Aela / Vort',  chosen: String(a.sound_4 || '—') },
                { pair: 'Veda / Flux',  chosen: String(a.sound_5 || '—') },
              ].map((item) => (
                <div key={item.pair} style={{ border: '1px solid rgba(236,232,224,0.08)', padding: '14px 16px' }}>
                  <div style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5650', marginBottom: '6px' }}>{item.pair}</div>
                  <div style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '20px', fontStyle: 'italic', color: '#ece8e0' }}>{item.chosen}</div>
                </div>
              ))}
            </div>
            <Field label="Derived profile" value={`${sonic.label} (${sonic.score}/4) — ${sonic.detail}`} />
          </Section>

          {/* Module 04 */}
          <Section num="04" title="Feeling">
            <Field label="What customer feels before finding this brand" value={String(a.before_feeling || '—')} />
            <Field label="First encounter feeling" value={firstEncounterLabel(String(a.first_encounter || ''))} />
            <Field label="Sensory / scent" value={sensoryLabel(String(a.sensory || ''))} />
          </Section>

          {/* Module 05 */}
          <Section num="05" title="Constraints">
            <Field label="Naming type" value={namingTypeLabel(String(a.naming_type || ''))} />
            <Field label="Domain requirement" value={domainLabel(String(a.domain_required || ''))} />
            <Field label="Language" value={languageLabel(a.language || '')} />
            <Field label="Syllable preference" value={syllableLabel(String(a.syllables || ''))} />
          </Section>

          {/* Module 06 */}
          <Section num="06" title="Free Association">
            <Field label="Seven words" value={String(a.seven_words || '—')} />
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
