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
class Scripture < ApplicationRecord
  acts_as_tenant(:account)
  belongs_to :playlist_section, optional: true
  has_one :playlist, through: :playlist_section
  has_many :schedule_items, as: :item, dependent: :destroy

  serialize :verses, Array

  def bible_reference
    "#{book_id} #{chapter_num} : #{from} #{to.present? ? "- #{to}" : nil} #{bible_version}"
  end

  def self.bible_versions
    ["NVI", "RVR1960"]
  end

  def self.open_bible_files
    {
      "NVI": "spa-NVI.xmm.xml",
      "RVR09": "spa-RVR09.usfx.xml",
      "RVR1960": "spa-RVR1960.xml"
    }
  end

  def self.open_bible_file_path(version)
    Rails.root.join("lib/open-bibles/#{open_bible_files[version.to_sym]}")
  end

  def bible_version
    super || "NVI"
  end

  def bible
    @bible = SimpleBibleLoader.load_bible(self.bible_version)
  end
end
