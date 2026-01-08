// Browser-friendly ChordPro renderer
// Adapted from charter to work without file system dependencies

export function formatChord(chord) {
  if (chord.length <= 1 || chord === "N.C.") {
    return chord
  }

  const chordRegEx = /^(?<flatted>[b#]{0,1})(?<root>[A-G1-7][#♯b♭]?(m(?!aj)|maj)?)(?<quality>(2|3|4|5|6|7|9|\(|\)|no|o|\+|add|dim|sus|aug){0,5})$/
  const chords = chord.split("/")

  const formatted = chords.map((c) => {
    const match = c.match(chordRegEx)
    if (!match || !match.groups) {
      return c
    }

    const { flatted = '', root = '', quality = '' } = match.groups
    return `${flatted}${root}${quality ? "<sup>" + quality + "</sup>" : ""}`
  })

  return formatted.length > 1 ? formatted.join("/") : formatted[0]
}

export function renderChart(chart) {
  let html = '<div id="charter-container">'

  // Safely get artist array
  const artists = chart.artist || []

  // Header
  html += '<span class="charter-song-header">'

  if (chart.title) {
    html += '<span class="charter-title-wrapper">'
    html += `<span class="charter-title">${escapeHtml(chart.title)}</span>`
    html += '</span>'
  }

  if (artists.length > 0) {
    for (const artist of artists) {
      html += '<span class="charter-artist-wrapper">'
      html += `<span class="charter-artist">${escapeHtml(artist)}</span>`
      html += '</span>'
    }
  }

  // Metadata (key, tempo, time)
  const metadata = []
  if (chart.key) metadata.push(`Key: ${escapeHtml(chart.key)}`)
  if (chart.tempo) metadata.push(`Tempo: ${escapeHtml(chart.tempo)}`)
  if (chart.time) metadata.push(`Time: ${escapeHtml(chart.time)}`)

  if (metadata.length > 0) {
    html += '<div class="charter-song-key-tempo-wrapper">'
    html += `<span class="charter-song-key-tempo">${metadata.join(" | ")}</span>`
    html += '</div>'
  }

  html += '</span>' // Close charter-song-header
  html += '<br>'
  html += '<pre class="charter-song-body">'

  // Sections
  const sections = chart.sections || []
  for (const section of sections) {
    html += '<span class="charter-section-wrapper">'

    if (section.title) {
      html += `<span class="charter-section-title">${escapeHtml(section.title)}</span>`
    }

    const lyrics = section.lyrics || []
    for (let lineIndex = 0; lineIndex < lyrics.length; lineIndex++) {
      html += '<span class="charter-song-line">'

      const chords = section.chords?.[lineIndex] || []
      const lyricLine = section.lyrics?.[lineIndex] || []
      const directions = section.directions?.[lineIndex] || []

      for (let i = 0; i < Math.max(chords.length, lyricLine.length); i++) {
        const chord = chords[i]
        const lyric = lyricLine[i] || ''
        const direction = directions[i] || ''

        if (chord) {
          html += '<span class="charter-chord-wrapper">'
          html += `<span class="charter-chord">${formatChord(chord)}</span>`
          html += `<span class="charter-chord-lyric">${escapeHtml(lyric)}</span>`
          html += '</span>'
        } else if (direction) {
          html += `<span class="charter-direction">${escapeHtml(direction)}</span>`
        } else if (lyric) {
          html += escapeHtml(lyric)
        }
      }

      html += '</span>\n'
    }

    html += '</span>\n\n'
  }

  html += '</pre>' // Close charter-song-body

  // Footer
  if (chart.footer && chart.footer.length > 0) {
    html += '<div class="charter-song-footer">'
    html += chart.footer.map(f => escapeHtml(f)).join('<br>')
    html += '</div>'
  }

  html += '</div>'

  return html
}

function escapeHtml(text) {
  if (typeof text !== 'string') return ''

  const div = document.createElement('div')
  div.textContent = text
  return div.innerHTML
}
