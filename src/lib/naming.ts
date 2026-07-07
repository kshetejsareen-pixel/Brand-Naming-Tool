import Anthropic from '@anthropic-ai/sdk'
import { type Answers, getReportModules, formatAnswer, phonosemanticProfile, SCREENS_BY_ID } from './schema'
import type { ProjectName } from './project'

export interface NamingResult {
  brandCharacter: string
  names: ProjectName[]
}

const NAMING_SCHEMA = {
  type: 'object',
  properties: {
    brandCharacter: {
      type: 'string',
      description: '2-3 sharp sentences on who this brand is, not what it does',
    },
    names: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          name: { type: 'string' },
          type: {
            type: 'string',
            enum: ['invented', 'evocative', 'metaphorical', 'compound', 'borrowed', 'geographical'],
          },
          rationale: { type: 'string', description: '2-3 sentences linking explicitly to specific diagnostic answers' },
          sonicFit: { type: 'string', description: 'why the phonetics match, or intentionally contrast, the stated sonic preferences' },
          direction: { type: 'string', description: 'one concrete extension: tagline territory, visual character, or verbal tone' },
          risk: { type: 'string', description: 'one honest concern: trademark, pronunciation, or cultural meaning' },
        },
        required: ['name', 'type', 'rationale', 'sonicFit', 'direction', 'risk'],
        additionalProperties: false,
      },
    },
  },
  required: ['brandCharacter', 'names'],
  additionalProperties: false,
} as const

export interface GenerateNamingOptions {
  existingNames?: string[]
  steeringNote?: string
}

function buildNamingPrompt(a: Answers, options: GenerateNamingOptions): string {
  const sections = getReportModules()
    .map((mod) => {
      if (mod.num === '03') {
        const profile = phonosemanticProfile(a)
        return [
          `${mod.label}:`,
          `${profile.direction} (${profile.score}/${profile.total} soft)`,
          formatAnswer('cultural_register', a.cultural_register),
        ].join('\n')
      }
      return [
        `${mod.label}:`,
        ...mod.ids.map((id) => `${SCREENS_BY_ID[id].briefLabel}: ${formatAnswer(id, a[id])}`),
      ].join('\n')
    })
    .join('\n\n')

  const parts = [`You are a senior brand strategist at K&A Studios, a boutique brand identity studio based in India. A client has completed the brand naming diagnostic below.

Client: ${a.client_name || '—'} · ${a.business_name || 'Unnamed project'} · ${a.industry || '—'}

${sections}

Summarise the brand character in 2-3 sharp sentences — who this brand is, not what it does. Then generate exactly 7 naming directions grounded in the diagnostic above. Each rationale must cite specific diagnostic answers, not generic naming advice. Ground each sonic-fit note in the sonic profile above.`]

  if (options.existingNames?.length) {
    parts.push(`These names have already been proposed for this brand — do not repeat any of them or suggest close variants (same root, same sound, same trick). Explore genuinely different territory:\n${options.existingNames.join(', ')}`)
  }

  if (options.steeringNote?.trim()) {
    parts.push(`Additional direction for this batch: ${options.steeringNote.trim()}`)
  }

  return parts.join('\n\n')
}

export async function generateNamingDirections(a: Answers, options: GenerateNamingOptions = {}): Promise<NamingResult | null> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) {
    console.warn('ANTHROPIC_API_KEY not set — skipping naming generation')
    return null
  }

  try {
    const client = new Anthropic({ apiKey })
    const response = await client.messages.create({
      model: 'claude-opus-4-8',
      max_tokens: 8000,
      thinking: { type: 'adaptive' },
      output_config: {
        effort: 'high',
        format: { type: 'json_schema', schema: NAMING_SCHEMA },
      },
      messages: [{ role: 'user', content: buildNamingPrompt(a, options) }],
    })

    if (response.stop_reason === 'refusal') {
      console.error('Naming generation refused')
      return null
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text')
    if (!textBlock) return null

    return JSON.parse(textBlock.text) as NamingResult
  } catch (err) {
    console.error('Naming generation failed:', err)
    return null
  }
}
