if defined?(Lograge)
  Rails.application.configure do
    config.lograge.enabled = true
    config.lograge.formatter = Lograge::Formatters::KeyValue.new

    # Add custom options to log output
    config.lograge.custom_options = lambda do |event|
      {
        host: event.payload[:host],
        params: event.payload[:params].except('controller', 'action', 'format', 'id')
      }
    end
  end
end
