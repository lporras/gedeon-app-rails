import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["tab", "panel"]
  static values = {
    defaultTab: { type: String, default: "songs" }
  }

  connect() {
    // Get the tab from URL hash or use default
    const hash = window.location.hash.replace('#', '')
    const initialTab = hash || this.defaultTabValue
    this.showTab(initialTab)
  }

  select(event) {
    event.preventDefault()
    const tabName = event.currentTarget.dataset.tabName
    this.showTab(tabName)

    // Update URL hash
    window.location.hash = tabName
  }

  showTab(tabName) {
    // Update tab buttons
    this.tabTargets.forEach(tab => {
      if (tab.dataset.tabName === tabName) {
        tab.classList.add("tab-active")
        tab.setAttribute("aria-selected", "true")
      } else {
        tab.classList.remove("tab-active")
        tab.setAttribute("aria-selected", "false")
      }
    })

    // Update panels
    this.panelTargets.forEach(panel => {
      const panelName = panel.dataset.tabPanel
      // Show the main panel or the songs-nav panel if songs tab is active
      if (panelName === tabName || (tabName === 'songs' && panelName === 'songs-nav')) {
        panel.classList.remove("hidden")
      } else {
        panel.classList.add("hidden")
      }
    })
  }
}
