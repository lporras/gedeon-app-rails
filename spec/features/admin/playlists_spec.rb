require 'rails_helper'

RSpec.feature 'Admin/Playlists', type: :feature do
  include_context "authenticated admin with subdomain"

  describe 'viewing playlist show page' do
    let!(:playlist) { create(:playlist, name: 'Sunday Service', account: account) }

    scenario 'displays View PDF action item' do
      visit admin_playlist_path(playlist)

      expect(page).to have_link('View PDF', href: view_pdf_admin_playlist_path(playlist, format: :pdf))
    end

    scenario 'View PDF link opens in new tab' do
      visit admin_playlist_path(playlist)

      view_pdf_link = find_link('View PDF')
      expect(view_pdf_link[:target]).to eq('_blank')
    end
  end

  describe 'viewing PDF' do
    let!(:playlist) { create(:playlist, name: 'Sunday Service', account: account) }
    let!(:playlist_section) { create(:playlist_section, name: 'Worship', playlist: playlist) }
    let!(:playlist_item) { create(:playlist_item, :with_song, playlist_section: playlist_section) }

    # Ensure playlist has proper structure for PDF generation
    before do
      expect(playlist.playlist_sections.count).to eq(1)
      expect(playlist.playlist_sections.first.playlist_items.count).to eq(1)
    end

    scenario 'generates PDF for playlist' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      # Check PDF headers are set
      expect(page.response_headers['Content-Type']).to include('application/pdf')
      expect(page.response_headers['Content-Disposition']).to include('inline')
    end

    scenario 'PDF filename matches playlist name' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page.response_headers['Content-Disposition']).to include('Sunday Service.pdf')
    end
  end

  describe 'PDF content' do
    let!(:song) { create(:song, title: 'Amazing Grace', content: "Amazing grace how sweet the sound\nThat saved a wretch like me", account: account) }
    let!(:playlist) { create(:playlist, name: 'Sunday Worship', account: account) }
    let!(:playlist_section) { create(:playlist_section, name: 'Opening Worship', playlist: playlist) }
    let!(:playlist_item) { create(:playlist_item, song: song, playlist_section: playlist_section, position: 1) }

    before do
      # Enable HTML rendering for testing PDF content
      allow_any_instance_of(Admin::PlaylistsController).to receive(:view_pdf) do |controller|
        controller.instance_variable_set(:@playlist, playlist)
        controller.render pdf: playlist.name,
                          encoding: 'utf-8',
                          layout: 'pdf',
                          show_as_html: true
      end
    end

    scenario 'includes playlist name' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('Sunday Worship')
    end

    scenario 'includes section name' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('Opening Worship')
    end

    scenario 'includes song title with position' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('1. Amazing Grace')
    end

    scenario 'includes song content' do
      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('Amazing grace how sweet the sound')
      expect(page).to have_content('That saved a wretch like me')
    end

    scenario 'displays multiple songs in order' do
      song2 = create(:song, title: 'How Great Thou Art', content: 'O Lord my God', account: account)
      create(:playlist_item, song: song2, playlist_section: playlist_section, position: 2)

      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('1. Amazing Grace')
      expect(page).to have_content('2. How Great Thou Art')
      expect(page).to have_content('O Lord my God')
    end

    scenario 'displays multiple sections' do
      section2 = create(:playlist_section, name: 'Closing', playlist: playlist)
      song2 = create(:song, title: 'Benediction', content: 'The Lord bless you', account: account)
      create(:playlist_item, song: song2, playlist_section: section2, position: 1)

      visit view_pdf_admin_playlist_path(playlist, format: :pdf)

      expect(page).to have_content('Opening Worship')
      expect(page).to have_content('Closing')
      expect(page).to have_content('Benediction')
    end
  end

  describe 'View PDF action item visibility' do
    let!(:playlist) { create(:playlist, name: 'Test Playlist', account: account) }

    scenario 'is visible on show page' do
      visit admin_playlist_path(playlist)

      expect(page).to have_link('View PDF')
    end

    scenario 'is not visible on index page' do
      visit admin_playlists_path

      expect(page).not_to have_link('View PDF')
    end

    scenario 'is not visible on edit page' do
      visit edit_admin_playlist_path(playlist)

      expect(page).not_to have_link('View PDF')
    end
  end
end
