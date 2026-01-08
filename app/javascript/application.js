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

// Install banner logic is now handled by the Stimulus controller
// (install_banner_controller.js) to avoid duplicate implementations