# == Schema Information
#
# Table name: playlists
#
#  id         :bigint           not null, primary key
#  active     :boolean
#  name       :string
#  created_at :datetime         not null
#  updated_at :datetime         not null
#  account_id :bigint
#
# Indexes
#
#  index_playlists_on_account_id  (account_id)
#
# Foreign Keys
#
#  fk_rails_...  (account_id => accounts.id)
#
require 'rails_helper'

RSpec.describe Playlist, type: :model do
  it_behaves_like "acts_as_tenant model"

  it { should have_many(:playlist_items) }
  it { should have_many(:playlist_sections) }
  it { should have_many(:songs).order(created_at: :asc) }


  context "when playlist has songs" do
    let(:playlist) { FactoryBot.create(:playlist) }
    let(:playlist_section) { FactoryBot.create(:playlist_section, playlist: playlist) }
    let!(:playlist_item) do
      FactoryBot.create(:playlist_item, :with_song, playlist_section: playlist_section)
    end

    describe "#song_titles" do
      it 'returns songs titles' do
        expect(playlist.song_titles).to eql([playlist_item.song.title])
      end
    end

    describe "#duplicate" do
      it 'creates a new playlist' do
        expect {
          playlist.duplicate
        }.to change { Playlist.count }.by(1)
      end

      it 'creates a playlist with same songs' do
        expect(playlist.duplicate.song_titles).to eql(playlist.song_titles)
      end
    end
  end
end
