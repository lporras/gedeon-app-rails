import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["input", "preview", "error"]
  static values = { debounce: { type: Number, default: 300 } }

  connect() {
    console.log("ChordPro preview controller connected")
    // Initialize preview if content exists
    if (this.hasInputTarget && this.inputTarget.value.trim()) {
      this.renderPreview()
    }
  }

  disconnect() {
    if (this.debounceTimer) clearTimeout(this.debounceTimer)
  }

  onInput() {
    // Debounce preview updates
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer)
    }
    this.debounceTimer = setTimeout(() => this.renderPreview(), this.debounceValue)
  }

  async renderPreview() {
    const chordProText = this.inputTarget.value.trim()

    if (!chordProText) {
      this.previewTarget.innerHTML = '<p class="placeholder-text">Preview will appear here...</p>'
      this.hideError()
      return
    }

    try {
      // Import our parser wrapper and custom renderer
      const { parse } = await import('../helpers/chordpro_parser_wrapper.js')
      const { renderChart } = await import('../helpers/charter_renderer.js')

      // Parse and render
      const chart = parse(chordProText)
      const htmlContent = renderChart(chart)

      this.previewTarget.innerHTML = htmlContent
      this.hideError()
    } catch (error) {
      console.error('ChordPro parsing error:', error)
      this.showError(error.message || 'Failed to parse ChordPro content')
    }
  }

  showError(message) {
    if (this.hasErrorTarget) {
      this.errorTarget.textContent = `Error: ${message}`
      this.errorTarget.classList.remove('hidden')
    }
  }

  hideError() {
    if (this.hasErrorTarget) {
      this.errorTarget.classList.add('hidden')
    }
  }
}
