# frozen_string_literal: true

class ScheduleImageUploader < CarrierWave::Uploader::Base
  include CarrierWave::MiniMagick

  def store_dir
    "uploads/schedule_images/#{model.id}"
  end

  version :thumb do
    process resize_to_fill: [200, 150]
  end

  def extension_allowlist
    %w[jpg jpeg gif png webp]
  end
end
