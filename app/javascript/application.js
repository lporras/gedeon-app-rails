// Entry point for the build script in your package.json
import "@hotwired/turbo-rails"
import './controllers';


console.log("application.js loaded")
// Register PWA Service Worker scoped to /app/
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/app/sw.js', { scope: '/app/' })
      .catch((err) => console.warn('SW registration failed', err));
  });
}

// Install banner logic (Android: beforeinstallprompt, iOS: instructional tip)
// Keep deferred prompt in outer scope so it persists across Turbo visits
let hmDeferredInstallPrompt = null;

window.addEventListener('beforeinstallprompt', (e) => {
  // Chrome/Android path: intercept and show our UI
  e.preventDefault();
  hmDeferredInstallPrompt = e;
  initInstallBanner();
});

function initInstallBanner() {
  // Only show on /app routes
  if (!location.pathname.startsWith('/app')) return;

  const banner = document.getElementById('install-banner');
  if (!banner) return;
  const actionBtn = document.getElementById('install-action');
  const dismissBtn = document.getElementById('install-dismiss');
  const iosTip = document.getElementById('ios-tip');
  const iosModal = document.getElementById('install-modal');

  const DISMISSED_KEY = 'hm_install_banner_dismissed_v2';

  // Installed or previously dismissed? Exit.
  const isStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
  if (isStandalone || localStorage.getItem(DISMISSED_KEY) === '1') return;

  const ua = window.navigator.userAgent;
  const isIOS = /iphone|ipad|ipod/i.test(ua);
  const isIOSChrome = isIOS && /CriOS/i.test(ua);

  // Make button label clearer on iOS; if iOS Chrome, indicate Safari is required
  if (isIOS && actionBtn) {
    actionBtn.textContent = isIOSChrome ? 'Cómo instalar (usar Safari)' : 'Cómo instalar';
  }

  // Show banner:
  // - Android: if we have a deferred prompt
  // - iOS: proactively show with tip (no beforeinstallprompt on iOS)
  if (hmDeferredInstallPrompt) {
    banner.classList.remove('hidden');
    if (iosTip) iosTip.classList.add('hidden');
  } else if (isIOS) {
    banner.classList.remove('hidden');
    // Keep instructions hidden until user clicks Install
    if (iosTip) iosTip.classList.add('hidden');
  }

  if (dismissBtn) {
    dismissBtn.addEventListener('click', () => {
      localStorage.setItem(DISMISSED_KEY, '1');
      banner.classList.add('hidden');
    });
  }

  if (actionBtn) {
    actionBtn.addEventListener('click', async () => {
      // Always reveal iOS guidance when user clicks Install
      if (iosTip) iosTip.classList.remove('hidden');
      if (hmDeferredInstallPrompt) {
        hmDeferredInstallPrompt.prompt();
        const { outcome } = await hmDeferredInstallPrompt.userChoice;
        hmDeferredInstallPrompt = null;
        if (outcome === 'accepted') banner.classList.add('hidden');
      } else if (isIOS) {
        // iOS: open instructional modal
        if (iosModal && typeof iosModal.showModal === 'function') {
          iosModal.showModal();
        }
      }
    });
  }
}

// Initialize on initial load, DOM ready, and Turbo navigations
document.addEventListener('DOMContentLoaded', initInstallBanner);
window.addEventListener('load', initInstallBanner);
document.addEventListener('turbo:load', initInstallBanner);