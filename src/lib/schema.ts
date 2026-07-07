// ─── Single source of truth for the naming diagnostic ─────────────────────────
//
// Every downstream renderer (questionnaire UI, Claude-ready brief, internal
// email, public brief page, admin dashboard) reads question definitions and
// answer-formatting logic from here. Nothing about what a value like
// `green_herb` or `Kova` *means* should ever be hardcoded a second time
// anywhere else — that duplication is how the four renderers drifted out of
// sync with each other in the first place.

export type ScreenType = 'text' | 'textarea' | 'choice' | 'binary'

export interface Option {
  value: string
  label: string
  sub?: string
}

export interface PairWord {
  word: string
  pole: 'soft' | 'hard'
}

export interface Screen {
  id: string
  type: ScreenType
  module: string
  moduleLabel: string
  briefLabel: string          // short field-key used in reports (email / Claude doc / brief page / admin)
  question: string            // conversational phrasing shown on-screen
  subtext?: string
  placeholder?: string
  options?: Option[]
  pair?: [PairWord, PairWord] // binary only
  multi?: boolean             // multi-select choice
  sonic?: true                 // marks the four soft/hard word-pair questions used for scoring
}

export type Answers = Record<string, string | string[] | undefined>

// ─── Question bank ────────────────────────────────────────────────────────────

export const SCREENS: Screen[] = [
  // Module 01 — The Business
  {
    id: 'what_it_does',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    briefLabel: 'What it does',
    question: 'What does the business do?',
    subtext: 'The simplest possible answer. One or two sentences.',
    placeholder: 'We help architects visualise spaces before they are built…',
  },
  {
    id: 'who_is_customer',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    briefLabel: 'Who the customer is',
    question: 'Who is the customer?',
    subtext: "Not a demographic. A person. Describe their life, what they care about, what they're trying to do.",
    placeholder: 'A 34-year-old woman building her first skincare brand out of her apartment in Bombay…',
  },
  {
    id: 'belief',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    briefLabel: 'Core belief',
    question: "What does this business believe that most others in its space don't?",
    subtext: 'The conviction that drives it. Not a feature — a worldview.',
    placeholder: 'We believe that luxury should feel effortless, not exclusive…',
  },
  {
    id: 'competitors',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    briefLabel: 'Competitors',
    question: 'Name 2–3 of your main competitors.',
    subtext: 'Just the names. No explanation needed.',
    placeholder: 'Fabindia, Jaypore, Raw Mango…',
  },
  {
    id: 'admired_name',
    type: 'textarea',
    module: '01', moduleLabel: 'The Business',
    briefLabel: 'Admired name',
    question: 'Name one brand — in any category — that you think is perfectly named.',
    subtext: 'And one line on what you like about it.',
    placeholder: 'Stripe — precise, no-nonsense, exactly what a payments company should be called…',
  },

  // Module 02 — Personality
  {
    id: 'room_entry',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    briefLabel: 'Room presence',
    question: 'If this brand walked into a room, how would people notice it?',
    options: [
      { value: 'quiet_confident', label: 'Quietly — and then suddenly everyone is drawn to it', sub: 'The kind of presence you can\'t explain' },
      { value: 'warm_host',       label: 'With warmth — it makes the room feel welcoming', sub: 'People feel at ease immediately' },
      { value: 'impossible_miss', label: 'Boldly — impossible to miss, unapologetic', sub: 'Takes up space without asking permission' },
      { value: 'best_conversation', label: 'Slowly — but it has the most interesting thing to say', sub: 'Worth waiting for' },
    ],
  },
  {
    id: 'acceptable_flaw',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    briefLabel: 'Acceptable flaw',
    question: 'If this brand had to be accused of one flaw, which would you rather it be?',
    subtext: 'Every brand trades off somewhere. Choose the one you can live with.',
    options: [
      { value: 'too_cold',      label: 'Too cold',              sub: 'Precise and reserved, at the cost of warmth.' },
      { value: 'too_playful',   label: 'Too playful',           sub: 'Full of personality, at the cost of gravitas.' },
      { value: 'too_niche',     label: 'Too niche',             sub: 'Deeply specific, at the cost of broad appeal.' },
      { value: 'too_expensive', label: 'Too expensive-feeling', sub: 'Elevated and rare, at the cost of accessibility.' },
    ],
  },
  {
    id: 'archetype_person',
    type: 'choice',
    module: '02', moduleLabel: 'Personality',
    briefLabel: 'Archetype',
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
    briefLabel: 'Legendary for',
    question: 'In ten years, if this brand is legendary — what is it legendary for?',
    subtext: 'Not a product or a service. A feeling, a reputation, a cultural mark.',
    placeholder: 'The studio that made Lucknow a reference point for modern craft…',
  },

  // Module 03 — Sound & Culture
  {
    id: 'sound_1',
    type: 'binary',
    module: '03', moduleLabel: 'Sound & Culture',
    briefLabel: 'Kova / Stryx',
    question: 'Which word feels more like this brand?',
    subtext: "Don't think. Choose fast.",
    pair: [{ word: 'Kova', pole: 'soft' }, { word: 'Stryx', pole: 'hard' }],
    sonic: true,
  },
  {
    id: 'sound_2',
    type: 'binary',
    module: '03', moduleLabel: 'Sound & Culture',
    briefLabel: 'Luma / Drak',
    question: 'Which word feels more like this brand?',
    pair: [{ word: 'Luma', pole: 'soft' }, { word: 'Drak', pole: 'hard' }],
    sonic: true,
  },
  {
    id: 'sound_3',
    type: 'binary',
    module: '03', moduleLabel: 'Sound & Culture',
    briefLabel: 'Nevo / Krix',
    question: 'Which word feels more like this brand?',
    pair: [{ word: 'Nevo', pole: 'soft' }, { word: 'Krix', pole: 'hard' }],
    sonic: true,
  },
  {
    id: 'sound_4',
    type: 'binary',
    module: '03', moduleLabel: 'Sound & Culture',
    briefLabel: 'Aela / Vort',
    question: 'Which word feels more like this brand?',
    pair: [{ word: 'Aela', pole: 'soft' }, { word: 'Vort', pole: 'hard' }],
    sonic: true,
  },
  {
    id: 'cultural_register',
    type: 'choice',
    module: '03', moduleLabel: 'Sound & Culture',
    briefLabel: 'Cultural register',
    question: 'Should the name feel rooted, or globally neutral?',
    subtext: 'Not a sound preference this time — a cultural one.',
    options: [
      { value: 'rooted', label: 'Rooted in Indian heritage', sub: 'Sanskrit-adjacent, heritage-inflected sounds will resonate.' },
      { value: 'global', label: 'Globally neutral', sub: 'Western-modern sounds, clean and category-neutral.' },
      { value: 'either', label: 'Open to either', sub: 'No strong pull — let the name decide.' },
    ],
  },

  // Module 04 — Feeling
  {
    id: 'before_feeling',
    type: 'text',
    module: '04', moduleLabel: 'Feeling',
    briefLabel: 'Before finding this brand',
    question: 'What does the customer feel right before they find this brand?',
    subtext: 'One word or a short phrase. The emotional state that makes them look.',
    placeholder: 'Frustrated. Unseen. Ready for something real…',
  },
  {
    id: 'first_encounter',
    type: 'choice',
    module: '04', moduleLabel: 'Feeling',
    briefLabel: 'First encounter feeling',
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
    briefLabel: 'Sensory / scent',
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
    briefLabel: 'Naming type',
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
    id: 'naming_stance',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    briefLabel: 'Naming stance',
    question: 'Should your name belong next to your competitors, or break their pattern?',
    subtext: 'Converging feels safe and recognizable. Diverging feels distinct and risky.',
    options: [
      { value: 'converge', label: 'Belong next to them', sub: "Recognizable within the category — an insider's name." },
      { value: 'diverge',  label: 'Break the pattern',   sub: "Refuse to sound like the category — an outsider's name." },
      { value: 'no_pref',  label: 'No preference',       sub: 'Whichever serves the brand best.' },
    ],
  },
  {
    id: 'domain_required',
    type: 'choice',
    module: '05', moduleLabel: 'Constraints',
    briefLabel: 'Domain requirement',
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
    briefLabel: 'Language',
    question: 'Which language must the name work in?',
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
    briefLabel: 'Syllables',
    question: 'How many syllables feels right?',
    subtext: 'Arc (1). Adobe, Stripe (2). Patagonia, Eleora (3–4).',
    options: [
      { value: '1',    label: 'One — short, punchy, impossible to mistype' },
      { value: '2',    label: 'Two — the most versatile, easiest to remember' },
      { value: '3_4',  label: 'Three to four — considered, has texture' },
      { value: 'open', label: 'No preference — let the name decide' },
    ],
  },
  {
    id: 'off_limits',
    type: 'textarea',
    module: '05', moduleLabel: 'Constraints',
    briefLabel: 'Off-limits',
    question: 'Any words, roots, sounds, or associations that are off-limits?',
    subtext: 'Past names, family names, competitor overlaps, anything that would feel wrong. Leave blank if none.',
    placeholder: 'Nothing starting with "Om-"… nothing that sounds like our old name, "Verve"…',
  },

  // Module 06 — Free Mind
  {
    id: 'seven_words',
    type: 'textarea',
    module: '06', moduleLabel: 'Free Mind',
    briefLabel: 'Seven words',
    question: 'Seven words.',
    subtext: 'Whatever comes when you imagine this brand fully real. Don\'t edit. Don\'t explain. Just write.',
    placeholder: 'Sunday morning  ·  grandmother\'s handwriting  ·  good paper…',
  },
]

export const SCREENS_BY_ID: Record<string, Screen> = Object.fromEntries(
  SCREENS.map((s) => [s.id, s]),
)

// ─── Answer formatting — the single place that expands a stored value back ───
// ─── into the human-readable text a reader (or Claude) actually needs ────────

export function formatAnswer(id: string, value: string | string[] | undefined): string {
  if (value === undefined || value === null || (Array.isArray(value) && value.length === 0) || value === '') {
    return '—'
  }

  const screen = SCREENS_BY_ID[id]
  if (!screen) return Array.isArray(value) ? value.join(', ') : value

  if (screen.type === 'choice' && screen.options) {
    const values = Array.isArray(value) ? value : [value]
    return values
      .map((v) => {
        const opt = screen.options!.find((o) => o.value === v)
        if (!opt) return v
        return opt.sub ? `${opt.label} — ${opt.sub}` : opt.label
      })
      .join('; ')
  }

  // binary and free-text answers are already human-readable as stored
  return Array.isArray(value) ? value.join(', ') : value
}

// ─── Phonosemantic (sonic) scoring — derived from schema, not hardcoded lists ─

export interface PhonoProfile {
  score: number
  total: number
  label: 'Soft / warm' | 'Hard / precise' | 'Balanced'
  direction: string
}

export function phonosemanticProfile(answers: Answers): PhonoProfile {
  const sonicScreens = SCREENS.filter((s) => s.sonic && s.pair)
  let score = 0

  for (const s of sonicScreens) {
    const chosen = answers[s.id]
    const word = Array.isArray(chosen) ? chosen[0] : chosen
    const match = s.pair!.find((p) => p.word === word)
    if (match?.pole === 'soft') score++
  }

  const total = sonicScreens.length
  const ratio = total > 0 ? score / total : 0.5

  let label: PhonoProfile['label'] = 'Balanced'
  let direction = 'Balanced — neither strongly soft nor hard. Test both sonic registers.'
  if (ratio >= 0.75) {
    label = 'Soft / warm'
    direction = 'Strong soft/warm preference — liquid consonants, open vowels. Name should flow and feel approachable.'
  } else if (ratio <= 0.25) {
    label = 'Hard / precise'
    direction = 'Strong hard/precise preference — sharp consonants, tight vowels. Name should feel crisp and decisive.'
  }

  return { score, total, label, direction }
}

// ─── Report grouping — one ordered pass, shared by every renderer ────────────

export interface ReportModule {
  num: string
  label: string
  ids: string[]
}

export function getReportModules(): ReportModule[] {
  const groups: ReportModule[] = []
  for (const s of SCREENS) {
    let group = groups.find((g) => g.num === s.module)
    if (!group) {
      group = { num: s.module, label: s.moduleLabel, ids: [] }
      groups.push(group)
    }
    group.ids.push(s.id)
  }
  return groups
}
