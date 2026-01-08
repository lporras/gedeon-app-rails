import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggleButton", "buttonText", "iconChords", "iconLyrics", "content", "chords"]

  connect() {
    this.showingChords = false
  }

  toggle() {
    this.showingChords = !this.showingChords

    if (this.showingChords) {
      // Show chords, hide content
      this.contentTargets.forEach(el => el.classList.add('hidden'))
      this.chordsTargets.forEach(el => el.classList.remove('hidden'))
      this.buttonTextTarget.textContent = 'Ver Letras'

      // Update button styling to show active state
      this.toggleButtonTarget.classList.remove('btn-primary')
      this.toggleButtonTarget.classList.add('btn-accent')

      // Swap icons: hide music note, show document
      this.iconChordsTarget.classList.add('hidden')
      this.iconLyricsTarget.classList.remove('hidden')
    } else {
      // Show content, hide chords
      this.contentTargets.forEach(el => el.classList.remove('hidden'))
      this.chordsTargets.forEach(el => el.classList.add('hidden'))
      this.buttonTextTarget.textContent = 'Ver Acordes'

      // Reset button styling to default state
      this.toggleButtonTarget.classList.remove('btn-accent')
      this.toggleButtonTarget.classList.add('btn-primary')

      // Swap icons: show music note, hide document
      this.iconChordsTarget.classList.remove('hidden')
      this.iconLyricsTarget.classList.add('hidden')
    }
  }
}
