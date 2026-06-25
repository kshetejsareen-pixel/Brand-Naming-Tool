import { NextRequest, NextResponse } from 'next/server'
import { Resend } from 'resend'
import { put } from '@vercel/blob'

const TO_EMAIL   = 'info@kshetejsareen.com'
const FROM_EMAIL = process.env.FROM_EMAIL ?? 'onboarding@resend.dev'
const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://brand-naming-tool.vercel.app'

// ─── Brief URL encoding ───────────────────────────────────────────────────────

function encodeBrief(answers: Record<string, string>): string {
  const payload = { answers, submittedAt: new Date().toISOString() }
  return Buffer.from(JSON.stringify(payload)).toString('base64')
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '')
}

// ─── Derived profiles ─────────────────────────────────────────────────────────

function phonosemanticProfile(a: Record<string, string>): string {
  const soft  = ['Kova', 'Luma', 'Nevo', 'Aela']
  const score = [a.sound_1, a.sound_2, a.sound_3, a.sound_4]
    .filter((v) => soft.includes(v)).length

  let direction = 'Balanced — neither strongly soft nor hard. Test both sonic registers.'
  if (score >= 3) direction = 'Strong soft/warm preference — liquid consonants, open vowels. Name should flow and feel approachable.'
  if (score <= 1) direction = 'Strong hard/precise preference — sharp consonants, tight vowels. Name should feel crisp and decisive.'

  const cultural = a.sound_5 === 'Veda'
    ? 'Cultural register: rooted — Sanskrit-adjacent, heritage-inflected sounds will resonate.'
    : a.sound_5 === 'Flux'
    ? 'Cultural register: global — Western-modern sounds, clean and category-neutral.'
    : ''

  const detail = [
    `Kova/Stryx → ${a.sound_1 || '—'}`,
    `Luma/Drak → ${a.sound_2 || '—'}`,
    `Nevo/Krix → ${a.sound_3 || '—'}`,
    `Aela/Vort → ${a.sound_4 || '—'}`,
    `Veda/Flux → ${a.sound_5 || '—'}`,
  ].join(' · ')

  return `${direction} (${score}/4 soft)${cultural ? ' · ' + cultural : ''} · ${detail}`
}

// ─── Claude-ready Phase 2 document (plain text, uploaded to Claude) ───────────

function buildClaudeDoc(a: Record<string, string>, briefUrl: string): string {
  const lang = Array.isArray(a.language)
    ? (a.language as unknown as string[]).join(', ')
    : (a.language ?? '—')

  return `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
K&A STUDIOS — BRAND NAMING BRIEF
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You are a senior brand strategist at K&A Studios, a boutique brand identity studio based in India. A client has completed the brand naming diagnostic below.

Begin by:
1. Reading all six modules carefully before generating anything
2. Summarising the brand character in 2–3 sharp sentences — who this brand is, not what it does
3. Generating 7 naming directions grounded in the diagnostic (see format below)
4. Asking which territory to develop further

Brief URL: ${briefUrl}
Client: ${a.client_name || '—'} · ${a.business_name || 'Unnamed project'} · ${a.industry || '—'}
Submitted: ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}

━━━ 01 — THE BUSINESS ━━━
What it does: ${a.what_it_does || '—'}
Who the customer is: ${a.who_is_customer || '—'}
Core belief: ${a.belief || '—'}
Competitors: ${a.competitors || '—'}
Admired name: ${a.admired_name || '—'}

━━━ 02 — PERSONALITY ━━━
Room presence: ${a.room_entry || '—'}
Anti-value (must never be): ${a.worst_when || '—'}
Archetype: ${a.archetype_person || '—'}
Legendary for: ${a.legendary_for || '—'}

━━━ 03 — SOUND (PHONOSEMANTIC) ━━━
${phonosemanticProfile(a)}

━━━ 04 — FEELING ━━━
Before finding this brand: ${a.before_feeling || '—'}
First encounter feeling: ${a.first_encounter || '—'}
Sensory / scent: ${a.sensory || '—'}

━━━ 05 — CONSTRAINTS ━━━
Naming type preference: ${a.naming_type || '—'}
Domain requirement: ${a.domain_required || '—'}
Language: ${lang}
Syllables: ${a.syllables || '—'}

━━━ 06 — FREE ASSOCIATION ━━━
Seven words: ${a.seven_words || '—'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
NAMING FORMAT — use this structure for each of the 7 names:

NAME: [proposed name]
TYPE: invented / evocative / metaphorical / compound / borrowed / geographical
RATIONALE: 2–3 sentences linking explicitly to specific diagnostic answers
SONIC FIT: why the phonetics match (or intentionally contrast) stated preferences
DIRECTIONS: one concrete extension — tagline territory, visual character, verbal tone
RISK: one honest concern — trademark, pronunciation, cultural meaning

Group names by territory where it emerges naturally.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━`
}

// ─── HTML email ───────────────────────────────────────────────────────────────

function buildEmail(a: Record<string, string>, briefUrl: string): string {
  const lang = Array.isArray(a.language)
    ? (a.language as unknown as string[]).join(', ')
    : (a.language ?? '—')

  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Brand Naming Brief</title>
<style>
  body { margin: 0; padding: 0; background: #0f0e0d; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; color: #c8c4ba; }
  .wrap { max-width: 660px; margin: 0 auto; padding: 48px 32px; }
  .header { border-bottom: 1px solid rgba(236,232,224,0.12); padding-bottom: 32px; margin-bottom: 40px; }
  .studio { font-size: 11px; letter-spacing: 0.28em; text-transform: uppercase; color: #8a857d; margin-bottom: 8px; }
  .report-title { font-size: 24px; color: #ece8e0; font-weight: 400; margin: 0 0 6px; }
  .report-sub { font-size: 13px; color: #8a857d; }
  .section { margin-bottom: 36px; }
  .section-label { font-size: 10px; letter-spacing: 0.28em; text-transform: uppercase; color: #8a857d; border-bottom: 1px solid rgba(236,232,224,0.08); padding-bottom: 10px; margin-bottom: 18px; }
  .field { margin-bottom: 14px; }
  .field-key { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: #6b6460; margin-bottom: 4px; }
  .field-val { font-size: 14px; color: #c8c4ba; line-height: 1.65; white-space: pre-wrap; }
  .brief-link { background: rgba(236,232,224,0.03); border: 1px solid rgba(236,232,224,0.10); padding: 20px 24px; margin-top: 8px; }
  .brief-link a { color: #ece8e0; word-break: break-all; font-size: 13px; }
  .claude-note { font-size: 12px; color: #8a857d; margin-top: 10px; line-height: 1.6; }
  .footer { margin-top: 48px; padding-top: 24px; border-top: 1px solid rgba(236,232,224,0.08); font-size: 11px; color: #5a5650; letter-spacing: 0.1em; }
</style>
</head>
<body>
<div class="wrap">
  <div class="header">
    <div class="studio">K&A Studios · Brand Naming Brief</div>
    <div class="report-title">${a.business_name || 'Unnamed Project'}</div>
    <div class="report-sub">${a.client_name || '—'} · ${a.industry || '—'} · ${new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</div>
  </div>

  <div class="section">
    <div class="section-label">Phase 2 — Next Steps</div>
    <div class="brief-link">
      <div class="field-key" style="margin-bottom:8px;">Brief URL</div>
      <a href="${briefUrl}">${briefUrl}</a>
      <div class="claude-note">The plain-text version of this email is a Claude-ready brief. Upload it to a new Claude conversation to begin naming generation and Phase 2 development.</div>
    </div>
  </div>

  <div class="section">
    <div class="section-label">Client</div>
    <div class="field"><div class="field-key">Name</div><div class="field-val">${a.client_name || '—'}</div></div>
    <div class="field"><div class="field-key">Business / Project</div><div class="field-val">${a.business_name || '—'}</div></div>
    <div class="field"><div class="field-key">Email</div><div class="field-val">${a.client_email || '—'}</div></div>
    <div class="field"><div class="field-key">Industry</div><div class="field-val">${a.industry || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section-label">01 — The Business</div>
    <div class="field"><div class="field-key">What it does</div><div class="field-val">${a.what_it_does || '—'}</div></div>
    <div class="field"><div class="field-key">Who the customer is</div><div class="field-val">${a.who_is_customer || '—'}</div></div>
    <div class="field"><div class="field-key">Core belief</div><div class="field-val">${a.belief || '—'}</div></div>
    <div class="field"><div class="field-key">Competitors</div><div class="field-val">${a.competitors || '—'}</div></div>
    <div class="field"><div class="field-key">Admired name</div><div class="field-val">${a.admired_name || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section-label">02 — Personality</div>
    <div class="field"><div class="field-key">Room presence</div><div class="field-val">${a.room_entry || '—'}</div></div>
    <div class="field"><div class="field-key">Must never be</div><div class="field-val">${a.worst_when || '—'}</div></div>
    <div class="field"><div class="field-key">Archetype</div><div class="field-val">${a.archetype_person || '—'}</div></div>
    <div class="field"><div class="field-key">Legendary for</div><div class="field-val">${a.legendary_for || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section-label">03 — Sound</div>
    <div class="field"><div class="field-key">Word pair choices</div><div class="field-val">Kova/Stryx → ${a.sound_1 || '—'}   Luma/Drak → ${a.sound_2 || '—'}   Nevo/Krix → ${a.sound_3 || '—'}   Aela/Vort → ${a.sound_4 || '—'}   Veda/Flux → ${a.sound_5 || '—'}</div></div>
    <div class="field"><div class="field-key">Derived sonic profile</div><div class="field-val">${phonosemanticProfile(a)}</div></div>
  </div>

  <div class="section">
    <div class="section-label">04 — Feeling</div>
    <div class="field"><div class="field-key">Before discovery</div><div class="field-val">${a.before_feeling || '—'}</div></div>
    <div class="field"><div class="field-key">First encounter feeling</div><div class="field-val">${a.first_encounter || '—'}</div></div>
    <div class="field"><div class="field-key">Sensory</div><div class="field-val">${a.sensory || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section-label">05 — Constraints</div>
    <div class="field"><div class="field-key">Naming type</div><div class="field-val">${a.naming_type || '—'}</div></div>
    <div class="field"><div class="field-key">Domain requirement</div><div class="field-val">${a.domain_required || '—'}</div></div>
    <div class="field"><div class="field-key">Language</div><div class="field-val">${lang}</div></div>
    <div class="field"><div class="field-key">Syllables</div><div class="field-val">${a.syllables || '—'}</div></div>
  </div>

  <div class="section">
    <div class="section-label">06 — Free Association</div>
    <div class="field"><div class="field-key">Seven words</div><div class="field-val">${a.seven_words || '—'}</div></div>
  </div>

  <div class="footer">
    K&A Studios · Brand Identity Development · info@kshetejsareen.com<br>
    This brief is confidential and for internal use only.
  </div>
</div>
</body>
</html>`
}

// ─── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  try {
    const answers = await req.json() as Record<string, string>

    const token    = encodeBrief(answers)
    const briefUrl = `${BASE_URL}/brief/${token}`

    const { data, error } = await resend.emails.send({
      from:    FROM_EMAIL,
      to:      TO_EMAIL,
      subject: `Brand Naming — ${answers.business_name || 'New submission'} · ${answers.client_name || 'Unknown'} · ${answers.industry || ''}`,
      html:    buildEmail(answers, briefUrl),
      text:    buildClaudeDoc(answers, briefUrl),
    })

    if (error) {
      console.error('Resend error:', JSON.stringify(error))
    } else {
      console.log('Email sent:', data?.id)
    }

    // Store submission to Blob — failsafe, independent of email
    try {
      const safeName = (answers.client_name || 'unknown')
        .replace(/[^a-z0-9]/gi, '-').toLowerCase().slice(0, 40)
      const filename = `submissions/${Date.now()}-${safeName}.json`
      await put(filename, JSON.stringify({
        submittedAt: new Date().toISOString(),
        briefUrl,
        emailStatus: error ? 'failed' : 'sent',
        answers,
      }, null, 2), { access: 'public', addRandomSuffix: false })
      console.log('Submission stored:', filename)
    } catch (blobErr) {
      console.error('Blob storage failed:', blobErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('Submit error:', err)
    return NextResponse.json({ ok: false }, { status: 500 })
  }
}
