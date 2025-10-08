# == Schema Information
#
# Table name: scriptures
#
#  id                  :bigint           not null, primary key
#  bible_version       :string
#  chapter_num         :string
#  content             :text
#  from                :integer
#  to                  :integer
#  verses              :text
#  created_at          :datetime         not null
#  updated_at          :datetime         not null
#  account_id          :bigint
#  book_id             :string
#  playlist_section_id :bigint
#
# Indexes
#
#  index_scriptures_on_account_id           (account_id)
#  index_scriptures_on_playlist_section_id  (playlist_section_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
FactoryBot.define do
  factory :scripture do
    book_id { "Genesis" }
    chapter_num { "1" }
    from { 1 }
    to { 5 }
    bible_version { "NVI" }
    content { "In the beginning..." }
  end
end
