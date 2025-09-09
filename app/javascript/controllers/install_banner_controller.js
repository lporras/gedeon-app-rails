import { Controller } from "@hotwired/stimulus"

export default class extends Controller {
  static targets = ["banner", "iosTip", "iosModal", "installButton", "dismissButton"]
  
  connect() {
    // Only initialize on the home#app page
    if (window.location.pathname === '/app') {
      this.setupEventListeners()
      this.initializeInstallPrompt()
      this.checkIfDismissed()
    } else {
      this.element.remove()
    }
  }
  
  disconnect() {
    this.removeEventListeners()
  }
  
  setupEventListeners() {
    if (this.hasDismissButtonTarget) {
      this.dismissButtonTarget.addEventListener('click', this.handleDismiss.bind(this))
    }
    
    if (this.hasInstallButtonTarget) {
      this.installButtonTarget.addEventListener('click', this.handleInstallClick.bind(this))
    }
    
    // Re-initialize when the page becomes visible again (for mobile devices)
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this))
  }
  
  removeEventListeners() {
    if (this.hasDismissButtonTarget) {
      this.dismissButtonTarget.removeEventListener('click', this.handleDismiss)
    }
    
    if (this.hasInstallButtonTarget) {
      this.installButtonTarget.removeEventListener('click', this.handleInstallClick)
    }
    
    document.removeEventListener('visibilitychange', this.handleVisibilityChange)
  }
  
  initializeInstallPrompt() {
    // Check if the browser supports PWA installation
    const handleBeforeInstallPrompt = (e) => {
      // Prevent the default install prompt
      e.preventDefault()
      
      // Store the event for later use
      this.deferredPrompt = e
      
      // Show the install banner
      this.showBanner()
      
      // Remove the event listener after it's been used
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
    
    // Add the event listener
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    
    // Check if the app is running in standalone mode (already installed)
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return
    }
    
    // For iOS devices
    this.isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream
    
    // Show banner for iOS after a delay if not in standalone mode
    if (this.isIOS && !window.navigator.standalone) {
      setTimeout(() => {
        // Double-check we're not in standalone mode before showing
        if (!window.matchMedia('(display-mode: standalone)').matches) {
          this.showBanner()
        }
      }, 3000)
    }
  }
  
  checkIfDismissed() {
    const wasDismissed = localStorage.getItem('installBannerDismissed')
    if (wasDismissed) {
      this.hideBanner()
    }
  }
  
  handleDismiss() {
    localStorage.setItem('installBannerDismissed', '1')
    this.hideBanner()
  }
  
  async handleInstallClick() {
    // Show iOS instructions if on iOS
    if (this.isIOS) {
      if (this.hasIosTipTarget) {
        this.iosTipTarget.classList.remove('hidden')
      }
      
      // Show iOS modal if available
      if (this.hasIosModalTarget && typeof this.iosModalTarget.showModal === 'function') {
        this.iosModalTarget.showModal()
      }
      return
    }
    
    // Handle PWA installation prompt
    if (this.deferredPrompt && typeof this.deferredPrompt.prompt === 'function') {
      try {
        await this.deferredPrompt.prompt()
        const { outcome } = await this.deferredPrompt.userChoice
        
        if (outcome === 'accepted') {
          this.hideBanner()
        }
      } catch (error) {
        console.error('Error handling install prompt:', error)
        // If prompt fails, show iOS instructions as fallback
        if (this.hasIosTipTarget) {
          this.iosTipTarget.classList.remove('hidden')
        }
      } finally {
        this.deferredPrompt = null
      }
    } else {
      // Fallback for browsers that don't support the beforeinstallprompt event
      if (this.hasIosTipTarget) {
        this.iosTipTarget.classList.remove('hidden')
      }
    }
  }
  
  handleVisibilityChange() {
    if (document.visibilityState === 'visible') {
      this.initializeInstallPrompt()
    }
  }
  
  showBanner() {
    if (this.hasBannerTarget) {
      this.bannerTarget.classList.remove('hidden')
    }
  }
  
  hideBanner() {
    if (this.hasBannerTarget) {
      this.bannerTarget.classList.add('hidden')
    }
  }
}
