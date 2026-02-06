# == Schema Information
#
# Table name: schedules
#
#  id              :bigint           not null, primary key
#  name            :string
#  presenter_state :jsonb
#  created_at      :datetime         not null
#  updated_at      :datetime         not null
#  account_id      :bigint
#
# Indexes
#
#  index_schedules_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Schedule < ApplicationRecord
  acts_as_tenant(:account)

  has_many :schedule_items, -> { order(position: :asc) }, dependent: :destroy
  has_many :songs, through: :schedule_items, source: :item, source_type: 'Song'
  has_many :scriptures, through: :schedule_items, source: :item, source_type: 'Scripture'
end
