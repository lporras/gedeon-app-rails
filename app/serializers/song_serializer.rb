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
class SongSerializer < ActiveModel::Serializer
  attributes :id, :title, :content, :position
  has_many :video_links, each_serializer: VideoLinkSerializer
  attributes :created_at, :updated_at
end
