'use client'

import { useState } from 'react'
import { type ProjectState, type ProjectStatus, PROJECT_STATUSES } from '@/lib/project'

export function ProjectPanel({
  token,
  adminKey,
  initial,
}: {
  token: string
  adminKey: string
  initial: ProjectState
}) {
  const [project, setProject] = useState<ProjectState>(initial)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [steeringNote, setSteeringNote] = useState('')
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)

  async function save(next: ProjectState) {
    setProject(next)
    setSaving(true)
    setSaved(false)
    try {
      const res = await fetch(`/api/submissions/${token}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify(next),
      })
      if (res.ok) setSaved(true)
    } finally {
      setSaving(false)
    }
  }

  async function generateMore() {
    setGenerating(true)
    setGenerateError(null)
    try {
      const res = await fetch(`/api/submissions/${token}/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-admin-key': adminKey },
        body: JSON.stringify({ steeringNote }),
      })
      const data = await res.json()
      if (res.ok && data.project) {
        setProject(data.project)
        setSteeringNote('')
      } else {
        setGenerateError('Generation failed — check that ANTHROPIC_API_KEY is configured.')
      }
    } catch {
      setGenerateError('Generation failed — network error.')
    } finally {
      setGenerating(false)
    }
  }

  const labelStyle: React.CSSProperties = {
    fontFamily: 'monospace', fontSize: '10px', color: '#5a5650',
    textTransform: 'uppercase', letterSpacing: '0.1em',
  }
  const textAreaStyle: React.CSSProperties = {
    width: '100%', background: 'rgba(236,232,224,0.03)',
    border: '1px solid rgba(236,232,224,0.08)', color: '#c8c4ba',
    fontSize: '12px', padding: '8px', fontFamily: 'inherit', resize: 'vertical',
  }

  return (
    <div style={{ marginTop: '24px', borderTop: '1px solid rgba(236,232,224,0.08)', paddingTop: '20px' }}>
      <div style={{ display: 'flex', gap: '16px', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap' }}>
        <label style={labelStyle}>Status</label>
        <select
          value={project.status}
          onChange={(e) => save({ ...project, status: e.target.value as ProjectStatus })}
          style={{
            background: '#0b0b0c', border: '1px solid rgba(236,232,224,0.18)',
            color: '#c8c4ba', fontFamily: 'monospace', fontSize: '11px', padding: '6px 10px',
          }}
        >
          {PROJECT_STATUSES.map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
        {saving && <span style={{ fontSize: '10px', color: '#5a5650' }}>Saving…</span>}
        {saved && !saving && <span style={{ fontSize: '10px', color: 'rgba(130,200,130,0.8)' }}>Saved</span>}
      </div>

      {project.brandCharacter && (
        <div style={{ marginBottom: '16px', fontSize: '13px', color: '#8a857d', lineHeight: 1.6, fontStyle: 'italic' }}>
          {project.brandCharacter}
        </div>
      )}

      {project.names.length === 0 ? (
        <div style={{ fontSize: '11px', color: '#5a5650', marginBottom: '16px' }}>
          No naming directions generated for this submission.
        </div>
      ) : (
        <div style={{ marginBottom: '16px' }}>
          {project.names.map((n, i) => (
            <div key={`${n.name}-${i}`} style={{ border: '1px solid rgba(236,232,224,0.08)', padding: '12px 16px', marginBottom: '8px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px', gap: '12px' }}>
                <span style={{ fontFamily: "'Cormorant Garamond', Georgia, serif", fontSize: '18px', fontStyle: 'italic', color: '#ece8e0' }}>
                  {n.name}{n.type && <span style={{ fontFamily: 'monospace', fontSize: '10px', color: '#6b6460', marginLeft: '8px' }}>{n.type}</span>}
                </span>
                <label style={{ fontSize: '10px', color: '#8a857d', display: 'flex', gap: '6px', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <input
                    type="radio"
                    name={`chosen-${token}`}
                    checked={project.chosenName === n.name}
                    onChange={() => save({ ...project, chosenName: n.name })}
                  />
                  Chosen
                </label>
              </div>
              {n.rationale && <div style={{ fontSize: '12px', color: '#8a857d', marginBottom: '4px', lineHeight: 1.5 }}>{n.rationale}</div>}
              {n.risk && <div style={{ fontSize: '11px', color: '#6b6460', marginBottom: '8px' }}>Risk: {n.risk}</div>}
              <textarea
                placeholder="Notes on this name…"
                defaultValue={n.note ?? ''}
                onBlur={(e) => {
                  const names = project.names.map((x, xi) => (xi === i ? { ...x, note: e.target.value } : x))
                  save({ ...project, names })
                }}
                style={textAreaStyle}
                rows={2}
              />
            </div>
          ))}
        </div>
      )}

      <div style={{ marginBottom: '20px', border: '1px solid rgba(236,232,224,0.08)', padding: '12px 16px' }}>
        <label style={{ ...labelStyle, display: 'block', marginBottom: '8px' }}>Generate more names</label>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          <input
            type="text"
            value={steeringNote}
            onChange={(e) => setSteeringNote(e.target.value)}
            placeholder={'Optional steering note — e.g. "more playful", "avoid Sanskrit roots"'}
            disabled={generating}
            style={{
              flex: '1 1 260px', background: 'rgba(236,232,224,0.03)',
              border: '1px solid rgba(236,232,224,0.08)', color: '#c8c4ba',
              fontSize: '12px', padding: '8px', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={generateMore}
            disabled={generating}
            style={{
              background: 'none', border: '1px solid rgba(236,232,224,0.18)',
              padding: '8px 16px', color: '#c8c4ba', fontFamily: 'monospace',
              fontSize: '11px', letterSpacing: '0.1em', textTransform: 'uppercase',
              cursor: generating ? 'not-allowed' : 'pointer', opacity: generating ? 0.5 : 1,
              whiteSpace: 'nowrap',
            }}
          >
            {generating ? 'Generating…' : 'Generate more'}
          </button>
        </div>
        {generateError && (
          <div style={{ fontSize: '11px', color: 'rgba(255,130,130,0.8)', marginTop: '8px' }}>{generateError}</div>
        )}
      </div>

      <label style={{ ...labelStyle, display: 'block', marginBottom: '6px' }}>Project notes</label>
      <textarea
        placeholder="Follow-up notes, client feedback, next steps…"
        defaultValue={project.notes ?? ''}
        onBlur={(e) => save({ ...project, notes: e.target.value })}
        style={textAreaStyle}
        rows={2}
      />
    </div>
  )
}
