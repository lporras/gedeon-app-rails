# == Schema Information
#
# Table name: songs
#
#  id               :bigint           not null, primary key
#  author           :string
#  chordpro_content :text
#  content          :text
#  position         :integer
#  title            :string
#  created_at       :datetime         not null
#  updated_at       :datetime         not null
#  account_id       :bigint
#
# Indexes
#
#  index_songs_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
class Song < ApplicationRecord
  acts_as_tenant(:account)

  has_and_belongs_to_many :playlists
  has_and_belongs_to_many :video_links
  has_many :schedule_items, as: :item, dependent: :destroy

  accepts_nested_attributes_for :video_links, reject_if: :all_blank, allow_destroy: true
end
