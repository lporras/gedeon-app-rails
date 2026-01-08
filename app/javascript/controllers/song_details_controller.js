import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["details"]

  connect() {
    this.isScrolling = false
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  toggle(event) {
    // Only handle when details is opened
    if (!this.detailsTarget.open || this.isScrolling) {
      return
    }

    // Disable scrollIntoView on mobile to prevent infinite loop issues
    if (this.isMobileDevice()) {
      return
    }

    // Set flag to prevent re-entry
    this.isScrolling = true

    // Wait for the collapse animation to start, then scroll
    setTimeout(() => {
      this.detailsTarget.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest'
      })

      // Clear flag after scroll completes
      setTimeout(() => {
        this.isScrolling = false
      }, 200)
    }, 150)
  }

  toggleFromButton() {
    // Toggle the details element open/closed state
    this.detailsTarget.open = !this.detailsTarget.open
  }
}
