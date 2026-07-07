// ─── Project record — turns a submission from a static log entry into a ──────
// ─── mutable pipeline the studio can actually work a naming project through ──

export type ProjectStatus =
  | 'new'
  | 'generated'
  | 'shortlisted'
  | 'presented'
  | 'decided'
  | 'handed_off'

export interface ProjectName {
  name: string
  type?: string
  rationale?: string
  sonicFit?: string
  direction?: string
  risk?: string
  note?: string
}

export interface ProjectState {
  status: ProjectStatus
  brandCharacter?: string
  names: ProjectName[]
  chosenName?: string
  notes?: string
}

export const DEFAULT_PROJECT: ProjectState = {
  status: 'new',
  names: [],
}

export const PROJECT_STATUSES: { value: ProjectStatus; label: string }[] = [
  { value: 'new', label: 'New' },
  { value: 'generated', label: 'Names generated' },
  { value: 'shortlisted', label: 'Shortlisted' },
  { value: 'presented', label: 'Presented to client' },
  { value: 'decided', label: 'Client decided' },
  { value: 'handed_off', label: 'Handed to identity design' },
]

const TOKEN_PATTERN = /^[a-f0-9]{32}$/

export function isValidToken(token: string): boolean {
  return TOKEN_PATTERN.test(token)
}
