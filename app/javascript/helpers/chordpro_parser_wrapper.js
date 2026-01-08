// Wrapper around charter's parser to handle edge cases
import { parse as charterParse } from 'chord-charter/src/chordpro.js'

export function parse(chordProText) {
  // Pre-process: if there are lyrics before any section marker, add a default section
  const lines = chordProText.split('\n')
  let hasSection = false
  let needsDefaultSection = false

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim()

    // Check if this is a section directive
    if (line.startsWith('{') && line.includes(':')) {
      const directive = line.substring(1, line.indexOf(':')).toLowerCase()
      if (directive === 'section' || directive === 'chorus' || directive === 'verse' ||
          directive === 'bridge' || directive === 'intro' || directive === 'outro' ||
          directive.startsWith('start_of')) {
        hasSection = true
        break
      }
    }

    // Check if this is a lyric line (has chords or plain text after directives)
    if (line.length > 0 && !line.startsWith('{') &&
        !line.startsWith('CCLI') && !line.startsWith('#')) {
      if (!hasSection) {
        needsDefaultSection = true
        break
      }
    }
  }

  // If we need a default section, add it
  let processedText = chordProText
  if (needsDefaultSection) {
    // Find where to insert the section
    const titleEndIndex = chordProText.search(/\n[^\{]/)
    if (titleEndIndex > -1) {
      processedText = chordProText.slice(0, titleEndIndex + 1) +
                     '{section:Song}\n' +
                     chordProText.slice(titleEndIndex + 1)
    } else {
      processedText = '{section:Song}\n' + chordProText
    }
  }

  // Parse with charter
  return charterParse(processedText)
}
