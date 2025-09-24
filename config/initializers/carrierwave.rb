CarrierWave.configure do |config|
  # In test and development we store files locally and avoid requiring
  # any AWS/S3 environment variables. This prevents CI from failing due to
  # missing secrets and speeds up tests.
  if Rails.env.test? || Rails.env.development?
    config.storage = :file
    # Disable processing in tests for faster runs
    config.enable_processing = false if Rails.env.test?
  else
    # Production/staging: use AWS S3
    config.storage    = :aws
    config.aws_bucket = ENV.fetch('S3_BUCKET_NAME')
    config.aws_acl    = 'public-read'

    # Optionally define an asset host for configurations that are fronted by a
    # content host, such as CloudFront.
    # config.asset_host = 'http://example.com'
    # config.asset_host = proc { |file| ... } # or can be a proc

    # The maximum period for authenticated_urls is only 7 days.
    # config.aws_authenticated_url_expiration = 60 * 60 * 24 * 7

    # Set custom options such as cache control to leverage browser caching.
    # You can use either a static Hash or a Proc.
    # config.aws_attributes = -> { {
    #   expires: 1.week.from_now.httpdate,
    #   cache_control: 'max-age=604800'
    # } }

    config.aws_credentials = {
      access_key_id:     ENV.fetch('AWS_ACCESS_KEY_ID'),
      secret_access_key: ENV.fetch('AWS_SECRET_ACCESS_KEY'),
      region:            ENV.fetch('AWS_REGION'), # Required
      stub_responses:    false
    }

    # Optional: Signing of download urls, e.g. for serving private content through
    # CloudFront. Be sure you have the `cloudfront-signer` gem installed and
    # configured:
    # config.aws_signer = -> (unsigned_url, options) do
    #   Aws::CF::Signer.sign_url(unsigned_url, options)
    # end
  end
end
