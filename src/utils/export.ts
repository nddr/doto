import type { NoteType } from '@/composables/useTodoList'

/**
 * Convert a single note to Markdown format
 */
export function noteToMarkdown(note: NoteType): string {
  const lines: string[] = []
  lines.push(`# ${note.name}`)
  lines.push('')

  if (note.type === 'task') {
    for (const todo of note.todos) {
      const checkbox = todo.completed ? '[x]' : '[ ]'
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
        const checkbox = todo.completed ? '[x]' : '[ ]'
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
        const checkbox = todo.completed ? '[x]' : '[ ]'
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
      const tagSuffix = note.tags && note.tags.length > 0 ? ` [${note.tags[0]}]` : ''
      lines.push(`## ${note.name}${tagSuffix}`)

      if (note.type === 'task') {
        for (const todo of note.todos) {
          const checkbox = todo.completed ? '[x]' : '[ ]'
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
