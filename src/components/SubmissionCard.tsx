'use client'

// React fully owns the expand/collapse state here (rather than the native
// <details>/<summary> element) on purpose. This card nests ProjectPanel, a
// substantial client component — pairing that with a native interactive
// element risks a real bug: if a user's browser finishes the native
// disclosure toggle before React finishes hydrating this subtree, the DOM
// diverges from what React expects, and React's reconciliation can corrupt
// nearby text nodes while patching things up. Using useState for open/closed
// removes any native-DOM-vs-React divergence entirely instead of working
// around symptoms of it.

import { useState } from 'react'
import { type Answers, SCREENS_BY_ID, formatAnswer } from '@/lib/schema'
import { type ProjectState, DEFAULT_PROJECT } from '@/lib/project'
import { ProjectPanel } from '@/components/ProjectPanel'

export interface Submission {
  token: string
  submittedAt: string
  briefUrl: string
  emailStatus: 'sent' | 'failed'
  answers: Answers
  project?: ProjectState
}

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

export function SubmissionCard({ s, index, adminKey }: { s: Submission & { blobUrl: string }; index: number; adminKey: string }) {
  const [open, setOpen] = useState(false)
  const a = s.answers
  const emailFailed = s.emailStatus === 'failed'

  return (
    <div style={{
      border: '1px solid rgba(236,232,224,0.10)',
      marginBottom: '12px',
      background: 'rgba(236,232,224,0.02)',
    }}>
      <div
        onClick={() => setOpen((o) => !o)}
        style={{
          padding: '20px 24px',
          display: 'flex',
          alignItems: 'center',
          gap: '20px',
          cursor: 'pointer',
          userSelect: 'none',
        }}
      >
        {/* Index */}
        <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#5a5650', minWidth: '28px' }}>
          #{index + 1}
        </span>

        {/* Name + business, with industry/date as a second line underneath —
            avoids fighting fixed-width columns for horizontal space */}
        <span style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
          <div style={{ overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>
            <span style={{ fontSize: '15px', color: '#ece8e0' }}>
              {val(a.client_name)}
            </span>
            {a.business_name && (
              <span style={{ fontSize: '13px', color: '#8a857d', marginLeft: '10px' }}>
                {val(a.business_name)}
              </span>
            )}
          </div>
          <div style={{
            fontFamily: 'monospace', fontSize: '10px', color: '#6b6460',
            letterSpacing: '0.08em', textTransform: 'uppercase', marginTop: '4px',
            overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis',
          }}>
            {val(a.industry)} · {fmtDate(s.submittedAt)}
          </div>
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
        <span style={{
          color: '#5a5650', fontSize: '12px', display: 'inline-block',
          transform: open ? 'rotate(90deg)' : 'none', transition: 'transform 150ms ease',
        }}>▸</span>
      </div>

      {open && (
        <div style={{ padding: '0 24px 28px', borderTop: '1px solid rgba(236,232,224,0.06)' }}>

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
                <Row k="What it does"      v={formatAnswer('what_it_does', a.what_it_does)} />
                <Row k="Customer"          v={formatAnswer('who_is_customer', a.who_is_customer)} />
                <Row k="Core belief"       v={formatAnswer('belief', a.belief)} />
                <Row k="Competitors"       v={formatAnswer('competitors', a.competitors)} />
                <Row k="Admired name"      v={formatAnswer('admired_name', a.admired_name)} />
                <Row k="Price tier"        v={formatAnswer('price_tier', a.price_tier)} />
              </Module>

              <Module label="02 — Personality">
                <Row k="Room presence"     v={formatAnswer('room_entry', a.room_entry)} />
                <Row k="Acceptable flaw"   v={formatAnswer('acceptable_flaw', a.acceptable_flaw)} />
                <Row k="Archetype"         v={formatAnswer('archetype_person', a.archetype_person)} />
                <Row k="Legendary for"     v={formatAnswer('legendary_for', a.legendary_for)} />
              </Module>

              <Module label="06 — Free Mind">
                <Row k="Seven words"       v={formatAnswer('seven_words', a.seven_words)} />
              </Module>
            </div>

            {/* Right column */}
            <div>
              <Module label="03 — Sound & Culture">
                <Row k={SCREENS_BY_ID.sound_1.briefLabel} v={formatAnswer('sound_1', a.sound_1)} />
                <Row k={SCREENS_BY_ID.sound_2.briefLabel} v={formatAnswer('sound_2', a.sound_2)} />
                <Row k={SCREENS_BY_ID.sound_3.briefLabel} v={formatAnswer('sound_3', a.sound_3)} />
                <Row k={SCREENS_BY_ID.sound_4.briefLabel} v={formatAnswer('sound_4', a.sound_4)} />
                <Row k="Market scope"      v={formatAnswer('market_scope', a.market_scope)} />
                <Row k="Cultural register" v={formatAnswer('cultural_register', a.cultural_register)} />
              </Module>

              <Module label="04 — Feeling">
                <Row k="Before discovery"  v={formatAnswer('before_feeling', a.before_feeling)} />
                <Row k="First encounter"   v={formatAnswer('first_encounter', a.first_encounter)} />
                <Row k="Sensory"           v={formatAnswer('sensory', a.sensory)} />
              </Module>

              <Module label="05 — Constraints">
                <Row k="Naming type"       v={formatAnswer('naming_type', a.naming_type)} />
                <Row k="Naming stance"     v={formatAnswer('naming_stance', a.naming_stance)} />
                <Row k="Domain"            v={formatAnswer('domain_required', a.domain_required)} />
                <Row k="Language"          v={formatAnswer('language', a.language)} />
                <Row k="Syllables"         v={formatAnswer('syllables', a.syllables)} />
                <Row k="Off-limits"        v={formatAnswer('off_limits', a.off_limits)} />
              </Module>
            </div>
          </div>

          {s.token && (
            <ProjectPanel token={s.token} adminKey={adminKey} initial={{ ...DEFAULT_PROJECT, ...s.project }} />
          )}
        </div>
      )}
    </div>
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
