class ManifestsController < ApplicationController
  # Serve a PWA manifest per subdomain, scoped to /app/
  def show
    sub = request.subdomains.first
    host = request.host
    # Ignore ngrok/random tunnel subdomains and blank values
    using_ngrok = host.end_with?(".ngrok.io") || host.end_with?(".ngrok-free.app")
    valid_sub = sub.present? && !using_ngrok

    # Prefer per-subdomain icons if present, otherwise fallback to shared icons
    icons_base = Rails.root.join('public', 'icons')
    sub_icons_dir = valid_sub ? icons_base.join(sub) : nil

    def icon_path_if_exists(path)
      File.exist?(path) ? path.to_s.delete_prefix(Rails.root.join('public').to_s) : nil
    end

    icon_192 = sub_icons_dir && icon_path_if_exists(sub_icons_dir.join('icon-192.png')) || icon_path_if_exists(icons_base.join('icon-192.png'))
    icon_512 = sub_icons_dir && icon_path_if_exists(sub_icons_dir.join('icon-512.png')) || icon_path_if_exists(icons_base.join('icon-512.png'))
    mask_192 = sub_icons_dir && icon_path_if_exists(sub_icons_dir.join('icon-192-maskable.png')) || icon_path_if_exists(icons_base.join('icon-192-maskable.png'))
    mask_512 = sub_icons_dir && icon_path_if_exists(sub_icons_dir.join('icon-512-maskable.png')) || icon_path_if_exists(icons_base.join('icon-512-maskable.png'))

    # Last-resort generic icon
    generic_icon = icon_path_if_exists(icons_base.join('icon.png'))

    icons = []
    if icon_192
      icons << { src: icon_192, type: 'image/png', sizes: '192x192', purpose: 'any' }
    end
    if icon_512
      icons << { src: icon_512, type: 'image/png', sizes: '512x512', purpose: 'any' }
    end
    if mask_192
      icons << { src: mask_192, type: 'image/png', sizes: '192x192', purpose: 'maskable' }
    end
    if mask_512
      icons << { src: mask_512, type: 'image/png', sizes: '512x512', purpose: 'maskable' }
    end
    if icons.empty? && generic_icon
      icons << { src: generic_icon, type: 'image/png', sizes: 'any', purpose: 'any maskable' }
    end

    app_name = valid_sub ? ["HolyMusic", sub].join(' – ') : "HolyMusic"

    manifest = {
      name: app_name,
      short_name: valid_sub ? sub : 'HolyMusic',
      description: 'Installable app for your church songs on HolyMusic',
      start_url: '/app/',
      scope: '/app/',
      display: 'standalone',
      background_color: '#0b1020',
      theme_color: '#0b1020',
      icons: icons
    }

    render json: manifest, content_type: 'application/manifest+json'
  end
end
