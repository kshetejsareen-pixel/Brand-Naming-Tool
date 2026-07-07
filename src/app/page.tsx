'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import type { Screen as QuestionScreen, Option, PairWord } from '@/lib/schema'
import { SCREENS as QUESTIONS } from '@/lib/schema'

// ─── Types ────────────────────────────────────────────────────────────────────
// The question content itself lives in src/lib/schema.ts — the single source
// every renderer (this UI, the submit route, the brief page, admin) reads
// from, so labels can't drift out of sync between them. This file only adds
// the flow-control screens (intro/info/submitting/done) around it.

type FlowType = 'intro' | 'info' | 'submitting' | 'done' | 'failed'
type ScreenType = QuestionScreen['type'] | FlowType

interface Screen {
  id: string
  type: ScreenType
  module?: string
  moduleLabel?: string
  question?: string
  subtext?: string
  placeholder?: string
  options?: Option[]
  pair?: [PairWord, PairWord]       // binary only
  multi?: boolean                   // multi-select choice
}

type Answers = Record<string, string | string[]>

// ─── Screen bank (flow screens + shared question bank) ───────────────────────

const SCREENS: Screen[] = [
  { id: 'intro', type: 'intro' },
  { id: 'info', type: 'info' },
  ...QUESTIONS,
  { id: 'submitting', type: 'submitting' },
  { id: 'done', type: 'done' },
  { id: 'failed', type: 'failed' },
]

const QUESTION_SCREENS = SCREENS.filter(
  (s) => !['intro', 'info', 'submitting', 'done', 'failed'].includes(s.type),
)
const TOTAL_QUESTIONS = QUESTION_SCREENS.length

function getProgressFraction(screen: Screen): number {
  if (screen.type === 'intro' || screen.type === 'info') return 0
  if (screen.type === 'submitting' || screen.type === 'done' || screen.type === 'failed') return 1
  const idx = QUESTION_SCREENS.findIndex((s) => s.id === screen.id)
  return (idx + 1) / TOTAL_QUESTIONS
}

function getCounter(screen: Screen, index: number): string {
  if (['intro', 'info', 'submitting', 'done', 'failed'].includes(screen.type)) return ''
  const qIndex = QUESTION_SCREENS.findIndex((s) => s.id === screen.id)
  if (qIndex < 0) return ''
  return `${String(qIndex + 1).padStart(2, '0')} / ${String(TOTAL_QUESTIONS).padStart(2, '0')}`
}

// ─── Main component ───────────────────────────────────────────────────────────

export default function Home() {
  const [idx, setIdx]         = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [value, setValue]     = useState<string | string[]>('')
  const [submitStep, setSubmitStep] = useState(0)
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null)

  const screen = SCREENS[idx]

  // Client info state (multi-field screen)
  const [info, setInfo] = useState({
    client_name:    '',
    business_name:  '',
    client_email:   '',
    industry:       '',
  })

  // Focus input on screen change
  useEffect(() => {
    const t = setTimeout(() => {
      inputRef.current?.focus()
    }, 500)
    return () => clearTimeout(t)
  }, [idx])

  // Reset value when screen changes
  useEffect(() => {
    const existing = answers[screen.id]
    setValue(existing ?? (screen.multi ? [] : ''))
  }, [idx, screen.id])

  const goBack = useCallback(() => {
    if (idx > 0) setIdx((i) => i - 1)
  }, [idx])

  const canAdvance = useCallback((): boolean => {
    if (screen.type === 'intro') return true
    if (screen.type === 'info') {
      return !!(info.client_name.trim() && info.client_email.trim() && info.industry)
    }
    if (screen.multi) return Array.isArray(value) && (value as string[]).length > 0
    return typeof value === 'string' ? value.trim().length > 0 : true
  }, [screen, value, info])

  const saveAndAdvance = useCallback(() => {
    if (!canAdvance()) return
    const updated: Answers = { ...answers }
    if (screen.type !== 'intro' && screen.type !== 'info') {
      updated[screen.id] = value
    }
    if (screen.type === 'info') {
      Object.assign(updated, info)
    }
    setAnswers(updated)
    setIdx((i) => i + 1)
  }, [canAdvance, screen, value, info, answers])

  // Enter key advances text/textarea
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Enter' && !e.shiftKey && screen.type === 'text') {
        e.preventDefault()
        saveAndAdvance()
      }
    },
    [screen.type, saveAndAdvance],
  )

  // Auto-advance binary after selection
  const selectBinary = useCallback(
    (word: string) => {
      setValue(word)
      const updated = { ...answers, [screen.id]: word }
      setAnswers(updated)
      setTimeout(() => setIdx((i) => i + 1), 320)
    },
    [screen.id, answers],
  )

  // Auto-advance single-choice after selection
  const selectChoice = useCallback(
    (val: string) => {
      if (screen.multi) {
        setValue((prev) => {
          const arr = Array.isArray(prev) ? prev : []
          return arr.includes(val) ? arr.filter((v) => v !== val) : [...arr, val]
        })
      } else {
        setValue(val)
        const updated = { ...answers, [screen.id]: val }
        setAnswers(updated)
        setTimeout(() => setIdx((i) => i + 1), 300)
      }
    },
    [screen.multi, screen.id, answers],
  )

  // Submit
  const handleSubmit = useCallback(async () => {
    setIdx(SCREENS.findIndex((s) => s.id === 'submitting'))
    setSubmitStep(1)

    await new Promise((r) => setTimeout(r, 900))
    setSubmitStep(2)

    let ok = false
    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
      ok = res.ok
    } catch (_) { /* network failure — ok stays false */ }

    setSubmitStep(3)
    await new Promise((r) => setTimeout(r, 600))
    setIdx(SCREENS.findIndex((s) => s.id === (ok ? 'done' : 'failed')))
  }, [answers])

  // Trigger submit when reaching submitting screen
  useEffect(() => {
    if (screen.type === 'submitting' && submitStep === 0) {
      handleSubmit()
    }
  }, [screen.type, submitStep, handleSubmit])

  // ─── Last question before submitting ───────────────────────────────────────
  const isLastQuestion = (() => {
    const submittingIdx = SCREENS.findIndex((s) => s.id === 'submitting')
    return idx === submittingIdx - 1
  })()

  // ─── Render helpers ────────────────────────────────────────────────────────

  function renderModule() {
    if (!screen.module) return null
    return (
      <div className="tool-module">
        {screen.module} — {screen.moduleLabel}
      </div>
    )
  }

  function renderNav(label = 'Continue', disabled = false) {
    const showBack = idx > 1  // skip intro (0) and info (1)
    return (
      <div className="tool-nav">
        {showBack && (
          <button className="tool-back" onClick={goBack}>← Back</button>
        )}
        <div>
          <button
            className="tool-next"
            onClick={isLastQuestion ? () => {
              const updated = { ...answers, [screen.id]: value }
              setAnswers(updated)
              setIdx((i) => i + 1)
            } : saveAndAdvance}
            disabled={disabled || !canAdvance()}
          >
            {label} <span className="tool-next-arrow">→</span>
          </button>
          {(screen.type === 'text' || screen.type === 'textarea') && (
            <p className="tool-hint">Press Enter to continue</p>
          )}
        </div>
      </div>
    )
  }

  // ─── Screen renderers ──────────────────────────────────────────────────────

  if (screen.type === 'intro') {
    return (
      <div className="tool-root">
        <div className="tool-progress-bar">
          <div className="tool-progress-fill" style={{ transform: 'scaleX(0)' }} />
        </div>
        <div className="tool-topbar">
          <span className="tool-topbar-logo">K&A Studios</span>
        </div>
        <div className="tool-screen">
          <div className="intro-eyebrow">Brand Naming Exercise</div>
          <h1 className="intro-title">
            Discover<br />your name.
          </h1>
          <p className="intro-body">
            This is a structured diagnostic developed by K&A Studios to surface the name your brand deserves.
            <br /><br />
            It takes 8–10 minutes. Work through it in one sitting. There are no right answers — only honest ones.
            <br /><br />
            Your responses are used by our team to develop naming directions. Nothing appears on this screen.
          </p>
          <button className="tool-next" onClick={saveAndAdvance}>
            Begin the exercise <span className="tool-next-arrow">→</span>
          </button>
          <p className="intro-note">
            Confidential · Shared only with K&A Studios
          </p>
        </div>
      </div>
    )
  }

  if (screen.type === 'info') {
    const INDUSTRIES = [
      'Fashion & Apparel', 'Beauty & Wellness', 'Food & Beverage',
      'Hospitality', 'Professional Services', 'Technology',
      'Health & Medicine', 'Arts & Culture', 'Real Estate',
      'Education', 'Retail', 'Other',
    ]
    return (
      <div className="tool-root">
        <div className="tool-progress-bar">
          <div className="tool-progress-fill" style={{ transform: 'scaleX(0)' }} />
        </div>
        <div className="tool-topbar">
          <span className="tool-topbar-logo">K&A Studios</span>
        </div>
        <div className="tool-screen">
          <div className="tool-module">Before we begin</div>
          <h2 className="tool-question" style={{ marginBottom: '12px' }}>
            Tell us about the project.
          </h2>
          <p className="tool-subtext">
            This is for our reference only — not shared with anyone outside K&A Studios.
          </p>
          <div className="tool-info-fields">
            <div className="tool-field">
              <label className="tool-field-label">Your name</label>
              <input
                className="tool-field-input"
                value={info.client_name}
                onChange={(e) => setInfo((p) => ({ ...p, client_name: e.target.value }))}
                placeholder="Your name"
                autoFocus
              />
            </div>
            <div className="tool-field">
              <label className="tool-field-label">Business / project name</label>
              <input
                className="tool-field-input"
                value={info.business_name}
                onChange={(e) => setInfo((p) => ({ ...p, business_name: e.target.value }))}
                placeholder="Leave blank if unnamed"
              />
            </div>
            <div className="tool-field">
              <label className="tool-field-label">Your email</label>
              <input
                className="tool-field-input"
                type="email"
                value={info.client_email}
                onChange={(e) => setInfo((p) => ({ ...p, client_email: e.target.value }))}
                placeholder="your@email.com"
              />
            </div>
            <div className="tool-field">
              <label className="tool-field-label">Industry / category</label>
              <select
                className="tool-field-select"
                value={info.industry}
                onChange={(e) => setInfo((p) => ({ ...p, industry: e.target.value }))}
              >
                <option value="">Select one</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="tool-nav">
            <button className="tool-back" onClick={goBack}>← Back</button>
            <div>
              <button className="tool-next" onClick={saveAndAdvance} disabled={!canAdvance()}>
                Start the exercise <span className="tool-next-arrow">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen.type === 'submitting') {
    const steps = [
      { label: 'Reviewing your responses', threshold: 1 },
      { label: 'Generating naming directions', threshold: 2 },
      { label: 'Sending to the K&A team', threshold: 3 },
    ]
    return (
      <div className="tool-root">
        <div className="tool-topbar">
          <span className="tool-topbar-logo">K&A Studios</span>
        </div>
        <div className="tool-screen">
          <div className="submitting-screen">
            <div className="submitting-spinner" />
            <div className="submitting-label">Working on your responses…</div>
            <div className="submitting-steps">
              {steps.map((step) => (
                <div
                  key={step.label}
                  className={`submitting-step${submitStep >= step.threshold ? (submitStep > step.threshold ? ' done' : ' active') : ''}`}
                >
                  {step.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen.type === 'done') {
    return (
      <div className="tool-root">
        <div className="tool-topbar">
          <span className="tool-topbar-logo">K&A Studios</span>
        </div>
        <div className="tool-screen">
          <div className="done-screen">
            <p className="done-mark">Thank you.</p>
            <div className="done-rule" />
            <p className="done-body">
              Your responses have been received. Our team will review them and develop naming directions based on the diagnostic.
              <br /><br />
              You'll hear from us shortly with next steps.
            </p>
            <div className="done-meta">
              K&A Studios · Brand Identity Development<br />
              info@kshetejsareen.com
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (screen.type === 'failed') {
    return (
      <div className="tool-root">
        <div className="tool-topbar">
          <span className="tool-topbar-logo">K&A Studios</span>
        </div>
        <div className="tool-screen">
          <div className="done-screen">
            <p className="done-mark">Something went wrong.</p>
            <div className="done-rule" />
            <p className="done-body">
              Your responses couldn't be saved. Please email them to us directly so nothing is lost, or try submitting again.
            </p>
            <div className="done-meta">
              K&A Studios · Brand Identity Development<br />
              info@kshetejsareen.com
            </div>
          </div>
        </div>
      </div>
    )
  }

  // ─── Standard question screens ─────────────────────────────────────────────
  const progress = getProgressFraction(screen)
  const counter  = getCounter(screen, idx)

  return (
    <div className="tool-root">
      <div className="tool-progress-bar">
        <div
          className="tool-progress-fill"
          style={{ transform: `scaleX(${progress})` }}
        />
      </div>
      <div className="tool-topbar">
        <span className="tool-topbar-logo">K&A Studios</span>
        {counter && <span className="tool-topbar-counter">{counter}</span>}
      </div>

      <div className="tool-screen" key={screen.id}>
        {renderModule()}
        <h2 className="tool-question">{screen.question}</h2>
        {screen.subtext && <p className="tool-subtext">{screen.subtext}</p>}

        {/* Text input */}
        {screen.type === 'text' && (
          <div className="tool-input-wrap">
            <input
              ref={inputRef as React.RefObject<HTMLInputElement>}
              className="tool-input"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={screen.placeholder}
              autoComplete="off"
            />
          </div>
        )}

        {/* Textarea */}
        {screen.type === 'textarea' && (
          <div className="tool-input-wrap">
            <textarea
              ref={inputRef as React.RefObject<HTMLTextAreaElement>}
              className="tool-textarea"
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => setValue(e.target.value)}
              placeholder={screen.placeholder}
              rows={4}
            />
          </div>
        )}

        {/* Single / multi choice */}
        {screen.type === 'choice' && (
          <div className="tool-choices">
            {screen.options!.map((opt) => {
              const isSelected = screen.multi
                ? Array.isArray(value) && (value as string[]).includes(opt.value)
                : value === opt.value
              return (
                <button
                  key={opt.value}
                  className={`tool-choice${isSelected ? ' selected' : ''}`}
                  onClick={() => selectChoice(opt.value)}
                >
                  <span className="tool-choice-label">{opt.label}</span>
                  {opt.sub && <span className="tool-choice-sub">{opt.sub}</span>}
                </button>
              )
            })}
          </div>
        )}

        {/* Binary word pair */}
        {screen.type === 'binary' && (
          <>
            {screen.subtext && idx === SCREENS.findIndex((s) => s.id === 'sound_1') && (
              <div className="tool-binary-intro">{screen.subtext}</div>
            )}
            <div className="tool-binary">
              {screen.pair!.map(({ word }) => (
                <button
                  key={word}
                  className={`tool-binary-word${value === word ? ' selected' : ''}`}
                  onClick={() => selectBinary(word)}
                >
                  {word}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Nav — hidden for auto-advance single-choice and binary */}
        {screen.type !== 'binary' && !(!screen.multi && screen.type === 'choice') && (
          renderNav(isLastQuestion ? 'Submit' : 'Continue')
        )}
      </div>
    </div>
  )
}
