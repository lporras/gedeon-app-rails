# Register correct MIME for web manifests in development/rails served assets
# Ensures /app/manifest.webmanifest is served with the right content type
if defined?(Rack::Mime)
  Rack::Mime::MIME_TYPES['.webmanifest'] = 'application/manifest+json'
end
