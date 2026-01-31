import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["dialog"]

  connect() {
    if (this.hasDialogTarget) {
      this.dialogTarget.showModal()
      this.boundClose = this.clearFrame.bind(this)
      this.dialogTarget.addEventListener('close', this.boundClose)
    }
  }

  disconnect() {
    if (this.hasDialogTarget && this.boundClose) {
      this.dialogTarget.removeEventListener('close', this.boundClose)
    }
  }

  close() {
    if (this.hasDialogTarget) {
      // Stop any video iframes before closing
      this.dialogTarget.querySelectorAll('iframe').forEach(iframe => {
        iframe.src = ''
      })
      this.dialogTarget.close()
    }
  }

  clearFrame() {
    const frame = document.getElementById('modal')
    if (frame) frame.innerHTML = ''
  }
}
