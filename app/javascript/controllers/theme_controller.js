import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["toggle"]
  
  connect() {
    this.initializeTheme()
    
    // Listen for system theme changes
    this.prefersDark = window.matchMedia('(prefers-color-scheme: dark)')
    this.prefersDark.addListener(() => this.initializeTheme())
  }
  
  disconnect() {
    if (this.prefersDark) {
      this.prefersDark.removeListener(() => this.initializeTheme())
    }
  }
  
  toggle() {
    const isDark = this.toggleTarget.checked
    this.setTheme(isDark ? 'dark' : 'light')
  }
  
  initializeTheme() {
    // Check for saved theme preference or use system preference
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
    const savedTheme = localStorage.getItem('theme') || (prefersDark ? 'dark' : 'light')
    
    this.setTheme(savedTheme, false)
  }
  
  setTheme(theme, savePreference = true) {
    const isDark = theme === 'dark'
    
    // Update DOM
    if (isDark) {
      document.documentElement.classList.add('dark')
      document.documentElement.setAttribute('data-theme', 'dark')
    } else {
      document.documentElement.classList.remove('dark')
      document.documentElement.setAttribute('data-theme', 'light')
    }
    
    // Update toggle state
    if (this.hasToggleTarget) {
      this.toggleTarget.checked = isDark
    }
    
    // Save preference
    if (savePreference) {
      localStorage.setItem('theme', theme)
    }
  }
}
