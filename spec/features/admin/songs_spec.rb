require 'rails_helper'

RSpec.feature 'Admin/Songs', :type => :feature do
  include_context "authenticated admin with subdomain"

  describe 'creating a song' do
    scenario 'can create a song with title, content, and author' do
      visit new_admin_song_path

      fill_in 'Title', with: 'Amazing Grace'
      fill_in 'Content', with: 'Amazing grace how sweet the sound'
      fill_in 'Author', with: 'John Newton'
      fill_in 'Position', with: '1'

      click_button 'Create Song'

      expect(page).to have_text('Song was successfully created')
      expect(page).to have_text('Amazing Grace')
      expect(page).to have_text('Amazing grace how sweet the sound')
      expect(page).to have_text('John Newton')
    end

    scenario 'can create a song with a YouTube video link', js: true do
      visit new_admin_song_path

      fill_in 'Title', with: 'Worship Song'
      fill_in 'Content', with: 'Lyrics here'
      fill_in 'Author', with: 'Test Author'

      click_button 'Create Song'

      # After creation, go to edit page to add video link
      click_link 'Edit Song'

      # Add video link using has_many form
      find('a', text: /Add New/).click

      # Wait for the new fields to appear and fill them
      within('.has_many_fields:last-of-type') do
        select 'Youtube', from: 'Provider'
        fill_in 'Url', with: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ'
      end

      click_button 'Update Song'

      expect(page).to have_text('Song was successfully updated')
      expect(VideoLink.last.video_id).to eq('dQw4w9WgXcQ')
    end
  end

  describe 'updating a song' do
    let!(:song) { Song.create!(title: 'Old Title', content: 'Old content', author: 'Old Author', position: 1) }

    scenario 'can update title, content, and author' do
      visit edit_admin_song_path(song)

      fill_in 'Title', with: 'New Title'
      fill_in 'Content', with: 'New content here'
      fill_in 'Author', with: 'New Author'

      click_button 'Update Song'

      expect(page).to have_text('Song was successfully updated')
      expect(page).to have_text('New Title')
      expect(page).to have_text('New content here')
      expect(page).to have_text('New Author')

      song.reload
      expect(song.title).to eq('New Title')
      expect(song.content).to eq('New content here')
      expect(song.author).to eq('New Author')
    end

    scenario 'can add a video link to existing song', js: true do
      visit edit_admin_song_path(song)

      find('a', text: /Add New/).click

      # Wait for the new fields to appear and fill them
      within('.has_many_fields:last-of-type') do
        select 'Youtube', from: 'Provider'
        fill_in 'Url', with: 'https://youtu.be/dQw4w9WgXcQ'
      end

      click_button 'Update Song'

      expect(page).to have_text('Song was successfully updated')

      song.reload
      expect(song.video_links.count).to eq(1)
      expect(song.video_links.first.provider).to eq('youtube')
      expect(song.video_links.first.video_id).to eq('dQw4w9WgXcQ')
    end
  end

  describe 'viewing song detail page with embedded video' do
    let!(:song) { Song.create!(title: 'Test Song', content: 'Test content', author: 'Test Author', position: 1) }
    let!(:video_link) { VideoLink.create!(provider: 'youtube', url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ') }

    before do
      song.video_links << video_link
    end

    scenario 'displays embedded YouTube video on show page' do
      visit admin_song_path(song)

      expect(page).to have_text('Test Song')
      expect(page).to have_text('Test content')
      expect(page).to have_text('Test Author')

      # Check that video embed iframe is present
      expect(page).to have_css('iframe[src*="youtube.com/embed/dQw4w9WgXcQ"]')
    end
  end
end
