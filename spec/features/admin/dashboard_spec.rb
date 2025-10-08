require 'rails_helper'

RSpec.feature 'Admin/Dashboard', :type => :feature do
  include_context "authenticated admin with subdomain"

  describe 'an authenticated admin' do
    scenario 'can view the dashboard' do
      visit admin_root_path
      expect(page).to have_text('Dashboard')
    end

    scenario 'can see recent songs panel' do
      song = Song.create!(title: 'Test Song')

      visit admin_root_path

      expect(page).to have_text('Recent Songs')
      expect(page).to have_link('Test Song', href: admin_song_path(song))
    end

    scenario 'can see recent playlists panel' do
      playlist = Playlist.create!(name: 'Test Playlist')

      visit admin_root_path

      expect(page).to have_text('Recent Playlists')
      expect(page).to have_link('Test Playlist', href: admin_playlist_path(playlist))
    end

    scenario 'can see recent studies panel' do
      study = Study.create!(title: 'Test Study')

      visit admin_root_path

      expect(page).to have_text('Recent Studies')
      expect(page).to have_link('Test Study', href: admin_study_path(study))
    end
  end
end
