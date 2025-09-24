require_relative 'boot'

require "rails"
# Pick the frameworks you want:
require "active_model/railtie"
require "active_job/railtie"
require "active_record/railtie"
require "active_storage/engine"
require "action_controller/railtie"
require "action_mailer/railtie"
require "action_view/railtie"
require "action_cable/engine"
require "sprockets/railtie"
# require "rails/test_unit/railtie"

# Require the gems listed in Gemfile, including any gems
# you've limited to :test, :development, or :production.
Bundler.require(*Rails.groups)

module GedeonAppRails
  class Application < Rails::Application
    # Initialize configuration defaults for originally generated Rails version.
    config.load_defaults 5.2

    # Settings in config/environments/* take precedence over those specified here.
    # Application configuration can go into files in config/initializers
    # -- all .rb files in that directory are automatically loaded after loading
    # the framework and any gems in your application.

    # Don't generate system test files.
    config.generators.test_framework :rspec

    config.assets.configure do |env|
      env.export_concurrent = false
    end

    # Rails 7: opt-in to the new connection handling to silence deprecation
    # and ensure compatibility with multiple databases behavior.
    config.active_record.legacy_connection_handling = false

    # Use URL-safe CSRF tokens (Rails 6.1+ behavior) to silence deprecation
    config.action_controller.urlsafe_csrf_tokens = true

    config.hosts = nil
  end
end
