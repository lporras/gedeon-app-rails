source 'https://rubygems.org'
git_source(:github) { |repo| "https://github.com/#{repo}.git" }

ruby '3.2.9'

# Bundle edge Rails instead: gem 'rails', github: 'rails/rails'
gem 'rails', '~> 7.0.5'
# Use postgresql as the database for Active Record
gem 'pg', '>= 1.5'
# Use Puma as the app server
gem 'puma', '~> 4.3'
# Use SCSS for stylesheets
gem 'sass-rails', '~> 6.0.0'
# Use Uglifier as compressor for JavaScript assets
gem 'uglifier', '>= 1.3.0'
# See https://github.com/rails/execjs#readme for more supported runtimes
# gem 'mini_racer', platforms: :ruby
gem 'jsbundling-rails'
gem 'turbo-rails'
gem "tailwindcss-rails", "~> 2.0"

# Use CoffeeScript for .coffee assets and views
gem 'coffee-rails', '~> 4.2'
# Turbolinks makes navigating your web application faster. Read more: https://github.com/turbolinks/turbolinks
# Build JSON APIs with ease. Read more: https://github.com/rails/jbuilder
gem 'jbuilder', '~> 2.5'
# Use Redis adapter to run Action Cable in production
gem 'redis', '~> 4.0'
# Use ActiveModel has_secure_password
# gem 'bcrypt', '~> 3.1.7'

# Use ActiveStorage variant
# gem 'mini_magick', '~> 4.8'

# Use Capistrano for deployment
# gem 'capistrano-rails', group: :development

# Reduces boot times through caching; required in config/boot.rb
gem 'bootsnap', '1.12.0', require: false

gem 'devise', '4.8.1'
gem 'activeadmin', github: 'activeadmin/activeadmin', branch: 'master'
gem 'active_skin'
gem 'activeadmin_addons', '1.9.0'
gem 'acts_as_tenant'
gem 'versionist'
gem 'active_model_serializers', '0.10.13'
gem 'newrelic_rpm'
gem 'wicked_pdf'
gem 'rollbar'
gem 'quiet_safari'
gem 'mimemagic', '0.3.10'
gem 'rack'
gem 'nokogiri', '~> 1.14'
gem 'inherited_resources', '1.13.1'
gem 'ffi', '~> 1.16'
gem 'thor', '1.2.1'
gem 'formtastic', '4.0.0.rc1'
gem 'net-smtp', require: false
gem 'net-imap', require: false
gem 'net-pop', require: false

gem 'ransack'
gem 'rswag'
gem 'video_player'
gem 'bible_parser'
gem 'ckeditor', github: 'galetahub/ckeditor'
gem 'carrierwave'
gem 'carrierwave-aws'
gem 'mini_magick'
gem 'jquery-rails', '~> 4.5.1'

group :development, :test do
  # Call 'byebug' anywhere in the code to stop execution and get a debugger console
  gem 'byebug', platforms: [:mri, :mingw, :x64_mingw]
  gem 'dotenv-rails'
  gem 'factory_bot_rails'
  gem 'faker'
  gem 'rspec-rails', '~> 4.0.0'
  gem "pry"
  gem "pry-remote"
  gem 'wkhtmltopdf-binary'
end

group :development do
  gem 'annotate'
  # Access an interactive console on exception pages or by calling 'console' anywhere in the code.
  gem 'web-console', '>= 3.3.0'
  gem 'listen', '3.7.1'
end

group :test do
  gem 'rspec', '~> 3.0'
  gem 'shoulda-matchers', '~> 5.0'
  gem 'database_cleaner-active_record'
  gem 'simplecov', require: false
end

# Windows does not include zoneinfo files, so bundle the tzinfo-data gem
gem 'tzinfo-data', platforms: [:mingw, :mswin, :x64_mingw, :jruby]
