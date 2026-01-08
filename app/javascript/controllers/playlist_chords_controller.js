import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggleButton", "buttonText", "content", "chords"]

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
    } else {
      // Show content, hide chords
      this.contentTargets.forEach(el => el.classList.remove('hidden'))
      this.chordsTargets.forEach(el => el.classList.add('hidden'))
      this.buttonTextTarget.textContent = 'Ver Acordes'
    }
  }
}
