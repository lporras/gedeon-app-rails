# Configure Capybara for headless testing
require 'selenium-webdriver'

# Register headless Chrome driver
Capybara.register_driver :headless_chrome do |app|
  options = Selenium::WebDriver::Chrome::Options.new
  options.add_argument('--headless')
  options.add_argument('--no-sandbox')
  options.add_argument('--disable-dev-shm-usage')
  options.add_argument('--disable-gpu')
  options.add_argument('--window-size=1400,900')

  Capybara::Selenium::Driver.new(app, browser: :chrome, options: options)
end

# Register headless Firefox driver (alternative)
Capybara.register_driver :headless_firefox do |app|
  options = Selenium::WebDriver::Firefox::Options.new
  options.add_argument('-headless')

  Capybara::Selenium::Driver.new(app, browser: :firefox, options: options)
end

# Use headless Chrome by default for JavaScript tests
# You can also use :headless_firefox if Chrome is not available
Capybara.javascript_driver = :headless_chrome

# Set default max wait time
Capybara.default_max_wait_time = 5
