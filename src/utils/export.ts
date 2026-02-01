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
 * Export all notes as a single Markdown file
 */
export function exportAllNotesAsFile(notes: NoteType[]): void {
  const markdown = allNotesToMarkdown(notes)
  const today = new Date().toISOString().split('T')[0]
  downloadMarkdown(markdown, `doto-notes-${today}`)
}

/**
 * Copy a single note to clipboard as Markdown
 */
export async function copyNoteToClipboard(note: NoteType): Promise<boolean> {
  const markdown = noteToMarkdown(note)
  return copyToClipboard(markdown)
}
