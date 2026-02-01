import JSZip from 'jszip'
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
 * Download content as a ZIP file
 */
export function downloadZip(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename.endsWith('.zip') ? filename : `${filename}.zip`
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * Export all notes as Markdown file(s)
 * - Single day: exports as a single .md file
 * - Multiple days: exports as a .zip containing one .md file per day
 */
export async function exportAllNotesAsFile(notes: NoteType[]): Promise<void> {
  const grouped = groupNotesByDate(notes)
  const dates = Array.from(grouped.keys()).sort((a, b) => {
    // Sort chronologically, with 'undated' at the end
    if (a === 'undated') return 1
    if (b === 'undated') return -1
    return a.localeCompare(b)
  })

  if (dates.length === 0) {
    return
  }

  if (dates.length === 1) {
    // Single day: export as single markdown file
    const date = dates[0] as string
    const dayNotes = grouped.get(date) as NoteType[]
    const markdown = notesForDayToMarkdown(date, dayNotes)
    const filename = date === 'undated' ? 'doto-notes-undated' : `doto-notes-${date}`
    downloadMarkdown(markdown, filename)
  } else {
    // Multiple days: create zip with one file per day
    const zip = new JSZip()

    for (const date of dates) {
      const dayNotes = grouped.get(date)!
      const markdown = notesForDayToMarkdown(date, dayNotes)
      const filename = date === 'undated' ? 'doto-notes-undated.md' : `doto-notes-${date}.md`
      zip.file(filename, markdown)
    }

    // Find date range for filename (excluding 'undated' from range display)
    const datedDates = dates.filter((d) => d !== 'undated')
    const startDate = datedDates[0] || 'undated'
    const endDate = datedDates[datedDates.length - 1] || 'undated'
    const zipFilename =
      startDate === endDate
        ? `doto-notes-${startDate}.zip`
        : `doto-notes-${startDate}-to-${endDate}.zip`

    const blob = await zip.generateAsync({ type: 'blob' })
    downloadZip(blob, zipFilename)
  }
}

/**
 * Copy a single note to clipboard as Markdown
 */
export async function copyNoteToClipboard(note: NoteType): Promise<boolean> {
  const markdown = noteToMarkdown(note)
  return copyToClipboard(markdown)
}
