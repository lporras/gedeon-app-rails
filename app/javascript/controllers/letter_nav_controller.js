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

  selectLetter(event) {
    event.preventDefault()
    const letter = event.currentTarget.dataset.letter
    const targetId = `letter-${letter}`

    // Update URL hash
    window.location.hash = targetId

    // Highlight the selected letter
    this.highlightLetter(letter)

    // Scroll to the section
    const targetElement = document.getElementById(targetId)
    if (targetElement) {
      const headerOffset = 100 // Adjust this value based on your fixed header height
      const elementPosition = targetElement.getBoundingClientRect().top
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      })
    }
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
