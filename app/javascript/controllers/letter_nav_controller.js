import { Controller } from "@hotwired/stimulus"

// Connects to data-controller="letter-nav"
export default class extends Controller {
  static targets = ["letter"]

  initialize() {
    // Bind methods to maintain 'this' context
    this.highlightLetterFromHash = this.highlightLetterFromHash.bind(this);
  }

  connect() {
    console.log('LetterNavController connected');

    // Wait for the next tick to ensure DOM is ready
    requestAnimationFrame(() => {
      // Check URL hash on page load
      this.highlightLetterFromHash();

      // Listen for hash changes (when clicking on letter links)
      window.addEventListener('hashchange', this.highlightLetterFromHash);
    });
  }

  disconnect() {
    window.removeEventListener('hashchange', this.highlightLetterFromHash);
  }

  isMobileDevice() {
    return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)
  }

  selectLetter(event) {
    // Let the browser handle navigation via the anchor href
    // Just highlight the selected letter
    const letter = event.currentTarget.dataset.letter
    this.highlightLetter(letter)
  }

  highlightLetterFromHash() {
    const hash = window.location.hash
    if (hash && hash.startsWith('#letter-')) {
      const letter = hash.replace('#letter-', '').charAt(0).toUpperCase()
      this.highlightLetter(letter)
    }
  }

  highlightLetter(letter) {
    // Remove active class from all letter buttons
    this.letterTargets.forEach(btn => {
      btn.classList.remove('btn-primary')
      btn.classList.add('btn-ghost')
    })

    // Add active class to the selected letter button
    const selectedBtn = this.letterTargets.find(btn =>
      btn.dataset.letter === letter
    )

    if (selectedBtn) {
      selectedBtn.classList.remove('btn-ghost')
      selectedBtn.classList.add('btn-primary')
    }
  }
}
