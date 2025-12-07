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
require 'rails_helper'

RSpec.describe Song, type: :model do
  it_behaves_like "acts_as_tenant model"

  it { should have_and_belong_to_many(:playlists) }
end
