# == Schema Information
#
# Table name: schedule_items
#
#  id          :bigint           not null, primary key
#  item_type   :string           not null
#  position    :integer          default(0)
#  created_at  :datetime         not null
#  updated_at  :datetime         not null
#  item_id     :bigint           not null
#  schedule_id :bigint           not null
#
# Indexes
#
#  index_schedule_items_on_item_type_and_item_id  (item_type,item_id)
#  index_schedule_items_on_schedule_id            (schedule_id)
#
# Foreign Keys
#
#  fk_rails_...  (schedule_id => schedules.id)
#
class ScheduleItem < ApplicationRecord
  belongs_to :schedule
  belongs_to :item, polymorphic: true

  default_scope { order(position: :asc) }
end
