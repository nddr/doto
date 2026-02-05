import type { NoteType } from '@/composables/useTodoList'
import { useTagStore } from '@/composables/useTagStore'

/**
 * Backup file structure for JSON export/import
 */
export interface DotoBackup {
  version: number
  exportedAt: string
  notes: NoteType[]
}

/**
 * Result of import validation
 */
export interface ImportResult {
  success: boolean
  notes?: NoteType[]
  error?: string
}

/**
 * Validate an individual note structure
 */
function validateNote(note: unknown, index: number): string | null {
  if (typeof note !== 'object' || note === null) {
    return `Note at index ${index}: must be an object`
  }

  const n = note as Record<string, unknown>

  if (typeof n.id !== 'number') {
    return `Note at index ${index}: missing or invalid id field`
  }

  if (typeof n.name !== 'string') {
    return `Note at index ${index}: missing or invalid name field`
  }

  if (n.type !== 'task' && n.type !== 'text') {
    return `Note at index ${index}: type must be 'task' or 'text'`
  }

  if (n.type === 'task') {
    if (!Array.isArray(n.todos)) {
      return `Note at index ${index}: task note must have todos array`
    }
    for (let i = 0; i < n.todos.length; i++) {
      const todo = n.todos[i] as Record<string, unknown>
      if (typeof todo !== 'object' || todo === null) {
        return `Note at index ${index}, todo at index ${i}: must be an object`
      }
      if (typeof todo.id !== 'number') {
        return `Note at index ${index}, todo at index ${i}: missing or invalid id`
      }
      if (typeof todo.title !== 'string') {
        return `Note at index ${index}, todo at index ${i}: missing or invalid title`
      }
      // Accept both new 'status' field and legacy 'completed' boolean
      const hasStatus = typeof todo.status === 'string' && ['incomplete', 'in-progress', 'completed'].includes(todo.status as string)
      const hasLegacyCompleted = typeof todo.completed === 'boolean'
      if (!hasStatus && !hasLegacyCompleted) {
        return `Note at index ${index}, todo at index ${i}: missing or invalid status/completed field`
      }
    }
  }

  if (n.type === 'text') {
    if (typeof n.content !== 'string') {
      return `Note at index ${index}: text note must have content string`
    }
  }

  return null
}

/**
 * Validate a full backup file structure
 */
export function validateBackup(data: unknown): ImportResult {
  if (typeof data !== 'object' || data === null) {
    return { success: false, error: 'Invalid backup file: not a valid object' }
  }

  const backup = data as Record<string, unknown>

  if (typeof backup.version !== 'number') {
    return { success: false, error: 'Invalid backup file: missing or invalid version field' }
  }

  if (backup.version !== 1) {
    return { success: false, error: `Unsupported backup version: ${backup.version}` }
  }

  if (!Array.isArray(backup.notes)) {
    return { success: false, error: 'Invalid backup file: notes must be an array' }
  }

  for (let i = 0; i < backup.notes.length; i++) {
    const error = validateNote(backup.notes[i], i)
    if (error) {
      return { success: false, error }
    }
  }

  return { success: true, notes: backup.notes as NoteType[] }
}

/**
 * Read and validate a JSON backup file
 */
export function readJsonFile(file: File): Promise<ImportResult> {
  return new Promise((resolve) => {
    const reader = new FileReader()

    reader.onload = () => {
      try {
        const data = JSON.parse(reader.result as string)
        resolve(validateBackup(data))
      } catch {
        resolve({ success: false, error: 'Failed to parse JSON file' })
      }
    }

    reader.onerror = () => {
      resolve({ success: false, error: 'Failed to read file' })
    }

    reader.readAsText(file)
  })
}

/**
 * Convert a single note to Markdown format
 */
export function noteToMarkdown(note: NoteType): string {
  const lines: string[] = []
  lines.push(`# ${note.name}`)
  lines.push('')

  if (note.type === 'task') {
    for (const todo of note.todos) {
      const checkbox = todo.status === 'completed' ? '[x]' : todo.status === 'in-progress' ? '[-]' : '[ ]'
      lines.push(`- ${checkbox} ${todo.title}`)
    }
  } else {
    lines.push(note.content || '')
  }

  return lines.join('\n')
}

/**
 * Convert all notes to a single Markdown document
 */
export function allNotesToMarkdown(notes: NoteType[]): string {
  const lines: string[] = []
  const today = new Date().toISOString().split('T')[0]

  lines.push('# Doto Notes')
  lines.push('')
  lines.push(`Exported on ${today}`)

  for (const note of notes) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(`## ${note.name}`)
    lines.push('')

    if (note.type === 'task') {
      for (const todo of note.todos) {
        const checkbox = todo.status === 'completed' ? '[x]' : todo.status === 'in-progress' ? '[-]' : '[ ]'
        lines.push(`- ${checkbox} ${todo.title}`)
      }
    } else {
      lines.push(note.content || '')
    }
  }

  return lines.join('\n')
}

/**
 * Download content as a Markdown file
 */
export function downloadMarkdown(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/markdown' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.md') ? filename : `${filename}.md`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Copy content to clipboard
 */
export async function copyToClipboard(content: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(content)
    return true
  } catch {
    return false
  }
}

/**
 * Export a single note as a Markdown file
 */
export function exportNoteAsFile(note: NoteType): void {
  const markdown = noteToMarkdown(note)
  const filename = note.name.replace(/[^a-z0-9]/gi, '-').toLowerCase()
  downloadMarkdown(markdown, filename)
}

/**
 * Group notes by their currentDate field
 */
export function groupNotesByDate(notes: NoteType[]): Map<string, NoteType[]> {
  const grouped = new Map<string, NoteType[]>()

  for (const note of notes) {
    const key = note.currentDate || 'undated'
    const existing = grouped.get(key) || []
    existing.push(note)
    grouped.set(key, existing)
  }

  return grouped
}

/**
 * Convert notes for a single day to Markdown format
 */
export function notesForDayToMarkdown(date: string, notes: NoteType[]): string {
  const lines: string[] = []
  const title = date === 'undated' ? 'Doto Notes - Undated' : `Doto Notes - ${date}`

  lines.push(`# ${title}`)

  for (const note of notes) {
    lines.push('')
    lines.push('---')
    lines.push('')
    lines.push(`## ${note.name}`)
    lines.push('')

    if (note.type === 'task') {
      for (const todo of note.todos) {
        const checkbox = todo.status === 'completed' ? '[x]' : todo.status === 'in-progress' ? '[-]' : '[ ]'
        lines.push(`- ${checkbox} ${todo.title}`)
      }
    } else {
      lines.push(note.content || '')
    }
  }

  return lines.join('\n')
}

/**
 * Get day of week abbreviation for a date string (YYYY-MM-DD format)
 */
function getDayOfWeek(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00')
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  return days[date.getDay()] as string
}

/**
 * Convert all notes to a single Markdown document grouped by date
 * Days are sorted in descending order (most recent first), with 'undated' at the end
 */
export function allNotesGroupedToMarkdown(notes: NoteType[]): string {
  const grouped = groupNotesByDate(notes)
  const dates = Array.from(grouped.keys()).sort((a, b) => {
    // Sort descending (most recent first), with 'undated' at the end
    if (a === 'undated') return 1
    if (b === 'undated') return -1
    return b.localeCompare(a)
  })

  const sections: string[] = []

  for (const date of dates) {
    const dayNotes = grouped.get(date)!
    const lines: string[] = []

    // Day header with day of week
    if (date === 'undated') {
      lines.push('# Undated')
    } else {
      lines.push(`# ${date} (${getDayOfWeek(date)})`)
    }

    // Each note as H2
    for (const note of dayNotes) {
      const tagId = note.tags?.[0]
      const tagName = tagId ? (useTagStore().getTag(tagId)?.name ?? tagId) : null
      const tagSuffix = tagName ? ` [${tagName}]` : ''
      lines.push(`## ${note.name}${tagSuffix}`)

      if (note.type === 'task') {
        for (const todo of note.todos) {
          const checkbox = todo.status === 'completed' ? '[x]' : todo.status === 'in-progress' ? '[-]' : '[ ]'
          lines.push(`- ${checkbox} ${todo.title}`)
        }
      } else {
        lines.push(note.content || '')
      }

      lines.push('')
    }

    sections.push(lines.join('\n'))
  }

  return sections.join('\n---\n\n')
}

/**
 * Export all notes as a single Markdown file
 */
export function exportAllNotesAsFile(notes: NoteType[]): void {
  if (notes.length === 0) {
    return
  }

  const markdown = allNotesGroupedToMarkdown(notes)

  // Find date range for filename (excluding 'undated' from range display)
  const grouped = groupNotesByDate(notes)
  const datedDates = Array.from(grouped.keys())
    .filter((d) => d !== 'undated')
    .sort()

  let filename: string
  if (datedDates.length === 0) {
    filename = 'doto-notes-undated'
  } else if (datedDates.length === 1) {
    filename = `doto-notes-${datedDates[0]}`
  } else {
    const startDate = datedDates[0]
    const endDate = datedDates[datedDates.length - 1]
    filename = `doto-notes-${startDate}-to-${endDate}`
  }

  downloadMarkdown(markdown, filename)
}

/**
 * Copy a single note to clipboard as Markdown
 */
export async function copyNoteToClipboard(note: NoteType): Promise<boolean> {
  const markdown = noteToMarkdown(note)
  return copyToClipboard(markdown)
}

/**
 * Download content as a JSON file
 */
export function downloadJson(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.json') ? filename : `${filename}.json`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export all notes as a JSON backup file
 */
export function exportAllNotesAsJson(notes: NoteType[]): void {
  if (notes.length === 0) {
    return
  }

  const backup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    notes: notes,
  }

  const json = JSON.stringify(backup, null, 2)
  const today = new Date().toISOString().split('T')[0]
  downloadJson(json, `doto-backup-${today}`)
}
