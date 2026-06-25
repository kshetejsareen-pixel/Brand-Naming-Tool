'use client'

import { useState, useEffect, useCallback, useRef } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ScreenType = 'intro' | 'info' | 'text' | 'textarea' | 'choice' | 'binary' | 'submitting' | 'done'

interface Option { value: string; label: string; sub?: string }

interface Screen {
  id: string
  type: ScreenType
  module?: string
  moduleLabel?: string
  question?: string
  subtext?: string
  placeholder?: string
  options?: Option[]
  pair?: [string, string]          // binary only
  multi?: boolean                  // multi-select choice
}

type Answers = Record<string, string | string[]>

// ─── Question bank ────────────────────────────────────────────────────────────

const SCREENS: Screen[] = [
  { id: 'intro', type: 'intro' },

  { id: 'info', type: 'info' },

  // Module 01 — The Business
  {
    id: 'what_it_does',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    question: 'What does the business do?',
    subtext: 'The simplest possible answer. One or two sentences.',
    placeholder: 'We help architects visualise spaces before they are built…',
  },
  {
    id: 'who_is_customer',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    question: 'Who is the customer?',
    subtext: "Not a demographic. A person. Describe their life, what they care about, what they're trying to do.",
    placeholder: 'A 34-year-old woman building her first skincare brand out of her apartment in Bombay…',
  },
  {
    id: 'belief',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    question: "What does this business believe that most others in its space don't?",
    subtext: 'The conviction that drives it. Not a feature — a worldview.',
    placeholder: 'We believe that luxury should feel effortless, not exclusive…',
  },
  {
    id: 'competitors',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    question: 'Name 2–3 of your main competitors.',
    subtext: 'Just the names. No explanation needed.',
    placeholder: 'Fabindia, Jaypore, Raw Mango…',
  },
  {
    id: 'admired_name',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    question: 'Name one brand — in any category — that you think is perfectly named.',
    subtext: 'And one line on what you like about it.',
    placeholder: 'Stripe — precise, no-nonsense, exactly what a payments company should be called…',
  },

  // Module 02 — Personality
  {
    id: 'room_entry',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    question: 'If this brand walked into a room, how would people notice it?',
    options: [
      { value: 'quiet_confident', label: 'Quietly — and then suddenly everyone is drawn to it', sub: 'The kind of presence you can\'t explain' },
      { value: 'warm_host',       label: 'With warmth — it makes the room feel welcoming', sub: 'People feel at ease immediately' },
      { value: 'impossible_miss', label: 'Boldly — impossible to miss, unapologetic', sub: 'Takes up space without asking permission' },
      { value: 'best_conversation', label: 'Slowly — but it has the most interesting thing to say', sub: 'Worth waiting for' },
    ],
  },
  {
    id: 'worst_when',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    question: 'This brand is at its worst when it is:',
    options: [
      { value: 'people_pleasing', label: 'Trying too hard to please everyone' },
      { value: 'cold',            label: 'Cold and transactional' },
      { value: 'complicated',     label: 'Overcomplicated and hard to understand' },
      { value: 'generic',         label: 'Generic — indistinguishable from everything else' },
    ],
  },
  {
    id: 'archetype_person',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    question: 'Which of these does this brand most resemble?',
    subtext: 'Go with instinct.',
    options: [
      { value: 'craftsperson', label: 'The master craftsperson', sub: 'Lets the work speak. Quiet authority.' },
      { value: 'guide',        label: 'The experienced guide', sub: 'Has been where you want to go. Trustworthy.' },
      { value: 'visionary',    label: 'The visionary', sub: 'Sees what others don\'t. Ahead of its time.' },
      { value: 'rebel',        label: 'The rebel', sub: 'Rewrites the rules. Doesn\'t ask for permission.' },
      { value: 'caregiver',    label: 'The caregiver', sub: 'Puts the other person first. Nurturing.' },
      { value: 'ruler',        label: 'The ruler', sub: 'Sets the standard. Commands respect.' },
    ],
  },
  {
    id: 'legendary_for',
    type: 'textarea',
    module: '02', moduleLabel: 'Personality',
    question: 'In ten years, if this brand is legendary — what is it legendary for?',
    subtext: 'Not a product or a service. A feeling, a reputation, a cultural mark.',
    placeholder: 'The studio that made Lucknow a reference point for modern craft…',
  },

  // Module 03 — Sound
  {
    id: 'sound_1',
    type: 'binary',
    module: '03', moduleLabel: 'Sound',
    question: 'Which word feels more like this brand?',
    subtext: "Don't think. Choose fast.",
    pair: ['Kova', 'Stryx'],
  },
  {
    id: 'sound_2',
    type: 'binary',
    module: '03', moduleLabel: 'Sound',
    question: 'Which word feels more like this brand?',
    pair: ['Luma', 'Drak'],
  },
  {
    id: 'sound_3',
    type: 'binary',
    module: '03', moduleLabel: 'Sound',
    question: 'Which word feels more like this brand?',
    pair: ['Nevo', 'Krix'],
  },
  {
    id: 'sound_4',
    type: 'binary',
    module: '03', moduleLabel: 'Sound',
    question: 'Which word feels more like this brand?',
    pair: ['Aela', 'Vort'],
  },
  {
    id: 'sound_5',
    type: 'binary',
    module: '03', moduleLabel: 'Sound',
    question: 'Which word feels more like this brand?',
    pair: ['Veda', 'Flux'],
  },

  // Module 04 — Feeling
  {
    id: 'before_feeling',
    type: 'text',
    module: '04', moduleLabel: 'Feeling',
    question: 'What does the customer feel right before they find this brand?',
    subtext: 'One word or a short phrase. The emotional state that makes them look.',
    placeholder: 'Frustrated. Unseen. Ready for something real…',
  },
  {
    id: 'first_encounter',
    type: 'choice',
    module: '04', moduleLabel: 'Feeling',
    question: 'What should someone feel the first time they encounter the name?',
    options: [
      { value: 'recognition', label: 'Instant recognition — this is for me', sub: 'Speaks directly to who they are' },
      { value: 'curiosity',   label: 'Curiosity — I need to know more', sub: 'Creates a pull, an open question' },
      { value: 'trust',       label: "Trust — these people know what they're doing", sub: 'Credibility before a word is spoken' },
      { value: 'aspiration',  label: 'Aspiration — I want to be associated with this', sub: 'Elevates the person who uses it' },
    ],
  },
  {
    id: 'sensory',
    type: 'choice',
    module: '04', moduleLabel: 'Feeling',
    question: 'If this brand were a scent, which is closest?',
    subtext: 'Sensory associations reveal brand character faster than words.',
    options: [
      { value: 'cedar_leather', label: 'Cedar and leather', sub: 'Classic. Grounded. Built to last.' },
      { value: 'fresh_linen',   label: 'Fresh linen', sub: 'Clean. Honest. Precise.' },
      { value: 'warm_vanilla',  label: 'Warm vanilla', sub: 'Nurturing. Familiar. Safe.' },
      { value: 'sea_air',       label: 'Sea air', sub: 'Free. Expansive. Alive.' },
      { value: 'dark_coffee',   label: 'Dark coffee', sub: 'Sharp. Focused. Uncompromising.' },
      { value: 'green_herb',    label: 'Green herbs and earth', sub: 'Natural. Rooted. Authentic.' },
    ],
  },

  // Module 05 — Constraints
  {
    id: 'naming_type',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    question: 'What kind of name feels right?',
    subtext: 'Go with instinct.',
    options: [
      { value: 'invented',    label: 'An invented word — something that didn\'t exist before', sub: 'Google, Kodak, Häagen-Dazs' },
      { value: 'real_word',   label: 'A real word — something that already means something', sub: 'Apple, Stripe, Amazon' },
      { value: 'compound',    label: 'A blend or compound — two ideas joined', sub: 'Facebook, YouTube, Pinterest' },
      { value: 'no_pref',     label: 'No preference — the best name wins', sub: 'Open to any direction' },
    ],
  },
  {
    id: 'domain_required',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    question: 'How important is getting the exact .com domain?',
    options: [
      { value: 'hard_yes',   label: 'Critical — the exact .com must be available', sub: 'Eliminates many otherwise strong names' },
      { value: 'preferred',  label: 'Preferred, but flexible — .co or .in works too', sub: 'Moderate constraint' },
      { value: 'not_a_priority', label: 'Not a priority right now', sub: 'Digital presence is secondary' },
    ],
  },
  {
    id: 'language',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    question: 'Which languages must the name work in?',
    multi: true,
    options: [
      { value: 'english', label: 'English' },
      { value: 'hindi',   label: 'Hindi' },
      { value: 'both',    label: 'Both — must read and sound natural in both' },
      { value: 'other',   label: 'Other / International' },
    ],
  },
  {
    id: 'syllables',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    question: 'How many syllables feels right?',
    subtext: 'Arc (1). Adobe, Stripe (2). Patagonia, Eleora (3–4).',
    options: [
      { value: '1',    label: 'One — short, punchy, impossible to mistype' },
      { value: '2',    label: 'Two — the most versatile, easiest to remember' },
      { value: '3_4',  label: 'Three to four — considered, has texture' },
      { value: 'open', label: 'No preference — let the name decide' },
    ],
  },

  // Module 06 — Free Mind
  {
    id: 'seven_words',
    type: 'textarea',
    module: '06', moduleLabel: 'Free Mind',
    question: 'Seven words.',
    subtext: 'Whatever comes when you imagine this brand fully real. Don\'t edit. Don\'t explain. Just write.',
    placeholder: 'Sunday morning  ·  grandmother\'s handwriting  ·  good paper…',
  },

  { id: 'submitting', type: 'submitting' },
  { id: 'done',       type: 'done'       },
]

const QUESTION_SCREENS = SCREENS.filter(
  (s) => !['intro', 'info', 'submitting', 'done'].includes(s.type),
)
const TOTAL_QUESTIONS = QUESTION_SCREENS.length

function getProgressFraction(screen: Screen): number {
  if (screen.type === 'intro' || screen.type === 'info') return 0
  if (screen.type === 'submitting' || screen.type === 'done') return 1
  const idx = QUESTION_SCREENS.findIndex((s) => s.id === screen.id)
  return (idx + 1) / TOTAL_QUESTIONS
}

function getCounter(screen: Screen, index: number): string {
  if (['intro', 'info', 'submitting', 'done'].includes(screen.type)) return ''
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

    try {
      await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(answers),
      })
    } catch (_) { /* still show done */ }

    setSubmitStep(3)
    await new Promise((r) => setTimeout(r, 600))
    setIdx(SCREENS.findIndex((s) => s.id === 'done'))
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
              {screen.pair!.map((word) => (
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
