# == Schema Information
#
# Table name: schedule_images
#
#  id          :bigint           not null, primary key
#  image       :string
#  name        :string
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  schedule_id :bigint
#
# Indexes
#
#  index_schedule_images_on_schedule_id  (schedule_id)
#
# Foreign Keys
#
#  fk_rails_...  (schedule_id => schedules.id)
#
class ScheduleImage < ApplicationRecord
  belongs_to :schedule
  has_many :schedule_items, as: :item, dependent: :destroy

  mount_uploader :image, ScheduleImageUploader

  validates :image, presence: true

  def title
    name.presence || "Image ##{id}"
  end
end
