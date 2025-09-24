Rails.application.routes.draw do
  mount Ckeditor::Engine => '/ckeditor'
  mount Rswag::Ui::Engine => '/api-docs'
  mount Rswag::Api::Engine => '/api-docs'

  devise_for :admin_users, ActiveAdmin::Devise.config
  ActiveAdmin.routes(self)

  root to: "home#show"
  get :app, to: "home#app"
  # PWA manifest per subdomain, scoped to /app/
  get "/app/manifest.webmanifest", to: "manifests#show"

  api_version(module: 'api/v1', path: { value: 'api/v1' }, defaults: { format: :json }) do
    resources :songs, only: [:show, :index]
    resources :playlists, only: [:show, :index]
  end
end
