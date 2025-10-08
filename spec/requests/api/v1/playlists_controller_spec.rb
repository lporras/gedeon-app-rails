require 'rails_helper'

RSpec.describe "Api::V1::Playlists", type: :request do
  # The API controller sets a default tenant to "ici-santiago" subdomain
  # So we create that account and test data belongs to it
  let!(:account) { create(:account, subdomain: "ici-santiago") }

  describe "GET /api/v1/playlists" do
    context "with playlists in the default tenant" do
      let!(:active_playlist1) do
        ActsAsTenant.with_tenant(account) { create(:playlist, name: "Sunday Service", active: true) }
      end
      let!(:active_playlist2) do
        ActsAsTenant.with_tenant(account) { create(:playlist, name: "Evening Worship", active: true) }
      end
      let!(:inactive_playlist) do
        ActsAsTenant.with_tenant(account) { create(:playlist, name: "Old Playlist", active: false) }
      end

      let!(:section1) do
        ActsAsTenant.with_tenant(account) { create(:playlist_section, playlist: active_playlist1, name: "Opening") }
      end
      let!(:section2) do
        ActsAsTenant.with_tenant(account) { create(:playlist_section, playlist: active_playlist1, name: "Main") }
      end

      let!(:song1) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 1") } }
      let!(:song2) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 2") } }

      let!(:playlist_item1) do
        ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section1, song: song1, position: 1) }
      end
      let!(:playlist_item2) do
        ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section2, song: song2, position: 2) }
      end

      it "returns only active playlists from the default tenant" do
        get "/api/v1/playlists"

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response.length).to eq(2)
        playlist_ids = json_response.map { |p| p["id"] }
        expect(playlist_ids).to include(active_playlist1.id, active_playlist2.id)
        expect(playlist_ids).not_to include(inactive_playlist.id)
      end

      context "PlaylistSerializer coverage" do
        it "serializes all playlist attributes correctly" do
          get "/api/v1/playlists"

          json_response = JSON.parse(response.body)
          playlist_json = json_response.find { |p| p["id"] == active_playlist1.id }

          # Verify all PlaylistSerializer attributes
          expect(playlist_json).to have_key("id")
          expect(playlist_json).to have_key("name")
          expect(playlist_json).to have_key("playlist_sections")
          expect(playlist_json).to have_key("created_at")
          expect(playlist_json).to have_key("updated_at")

          expect(playlist_json["id"]).to eq(active_playlist1.id)
          expect(playlist_json["name"]).to eq(active_playlist1.name)
        end

        it "serializes playlist_sections with PlaylistSectionSerializer" do
          get "/api/v1/playlists"

          json_response = JSON.parse(response.body)
          playlist_json = json_response.find { |p| p["id"] == active_playlist1.id }
          section_json = playlist_json["playlist_sections"].first

          # Verify all PlaylistSectionSerializer attributes
          expect(section_json).to have_key("id")
          expect(section_json).to have_key("name")
          expect(section_json).to have_key("playlist_items")

          expect(section_json["name"]).to eq("Opening")
          expect(playlist_json["playlist_sections"].length).to eq(2)
        end

        it "serializes playlist_items with PlaylistItemSerializer" do
          get "/api/v1/playlists"

          json_response = JSON.parse(response.body)
          playlist_json = json_response.find { |p| p["id"] == active_playlist1.id }
          section_json = playlist_json["playlist_sections"].first
          item_json = section_json["playlist_items"].first

          # Verify all PlaylistItemSerializer attributes
          expect(item_json).to have_key("id")
          expect(item_json).to have_key("position")
          expect(item_json).to have_key("song")

          expect(item_json["position"]).to eq(1)
          expect(item_json["song"]).to be_present
          expect(item_json["song"]["title"]).to eq("Song 1")
        end
      end
    end

    context "when no active playlists exist" do
      it "returns an empty array" do
        get "/api/v1/playlists"

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq([])
      end
    end
  end

  describe "GET /api/v1/playlists/:id" do
    let!(:playlist) do
      ActsAsTenant.with_tenant(account) { create(:playlist, name: "Test Playlist", active: true) }
    end
    let!(:section) do
      ActsAsTenant.with_tenant(account) { create(:playlist_section, playlist: playlist, name: "Section 1") }
    end
    let!(:song) do
      ActsAsTenant.with_tenant(account) { create(:song, title: "Amazing Grace") }
    end
    let!(:playlist_item) do
      ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section, song: song, position: 1) }
    end

    it "returns the requested playlist from the default tenant" do
      get "/api/v1/playlists/#{playlist.id}"

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response["id"]).to eq(playlist.id)
      expect(json_response["name"]).to eq("Test Playlist")
    end

    it "includes nested playlist_sections but not deeply nested items in show action" do
      get "/api/v1/playlists/#{playlist.id}"

      json_response = JSON.parse(response.body)
      section_json = json_response["playlist_sections"].first

      # The show action only includes sections, not the nested items
      # This is different from the index action which specifies explicit includes
      expect(section_json).to be_present
      expect(section_json["name"]).to eq("Section 1")
      expect(json_response["playlist_sections"].length).to eq(1)
    end

    it "raises error when playlist does not exist" do
      expect {
        get "/api/v1/playlists/99999"
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    context "PlaylistSerializer coverage" do
      it "serializes all attributes correctly" do
        get "/api/v1/playlists/#{playlist.id}"

        json_response = JSON.parse(response.body)

        # Verify all PlaylistSerializer attributes
        expect(json_response).to have_key("id")
        expect(json_response).to have_key("name")
        expect(json_response).to have_key("playlist_sections")
        expect(json_response).to have_key("created_at")
        expect(json_response).to have_key("updated_at")

        expect(json_response["id"]).to eq(playlist.id)
        expect(json_response["name"]).to eq(playlist.name)
      end

      it "serializes playlist_sections with PlaylistSectionSerializer" do
        get "/api/v1/playlists/#{playlist.id}"

        json_response = JSON.parse(response.body)
        section_json = json_response["playlist_sections"].first

        # Verify PlaylistSectionSerializer basic attributes
        # Note: show action doesn't include nested playlist_items like index does
        expect(section_json).to have_key("id")
        expect(section_json).to have_key("name")

        expect(section_json["id"]).to be_present
        expect(section_json["name"]).to eq("Section 1")
      end
    end
  end

  describe "tenant isolation" do
    let(:other_account) { create(:account, subdomain: "other-account") }
    let!(:account_playlist) do
      ActsAsTenant.with_tenant(account) { create(:playlist, name: "Default Account Playlist", active: true) }
    end
    let!(:other_account_playlist) do
      ActsAsTenant.with_tenant(other_account) { create(:playlist, name: "Other Account Playlist", active: true) }
    end

    it "only returns playlists from the default tenant (ici-santiago)" do
      get "/api/v1/playlists"
      json_response = JSON.parse(response.body)

      # Should include the default account's playlist
      expect(json_response.map { |p| p["id"] }).to include(account_playlist.id)
      # Should not include other account's playlist
      expect(json_response.map { |p| p["id"] }).not_to include(other_account_playlist.id)
    end

    it "raises error when trying to access playlist from another tenant" do
      expect {
        get "/api/v1/playlists/#{other_account_playlist.id}"
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "complex nested structure" do
    let!(:playlist) do
      ActsAsTenant.with_tenant(account) { create(:playlist, name: "Complex Playlist", active: true) }
    end

    let!(:section1) do
      ActsAsTenant.with_tenant(account) { create(:playlist_section, playlist: playlist, name: "Opening Songs") }
    end
    let!(:section2) do
      ActsAsTenant.with_tenant(account) { create(:playlist_section, playlist: playlist, name: "Worship Time") }
    end

    let!(:song1) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 1") } }
    let!(:song2) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 2") } }
    let!(:song3) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 3") } }
    let!(:song4) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song 4") } }

    let!(:playlist_item1) do
      ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section1, song: song1, position: 1) }
    end
    let!(:playlist_item2) do
      ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section1, song: song2, position: 2) }
    end
    let!(:playlist_item3) do
      ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section2, song: song3, position: 1) }
    end
    let!(:playlist_item4) do
      ActsAsTenant.with_tenant(account) { create(:playlist_item, playlist_section: section2, song: song4, position: 2) }
    end

    it "properly serializes complex nested structures in index" do
      get "/api/v1/playlists"

      json_response = JSON.parse(response.body)
      playlist_json = json_response.find { |p| p["id"] == playlist.id }

      expect(playlist_json["playlist_sections"].length).to eq(2)

      section1_json = playlist_json["playlist_sections"].find { |s| s["name"] == "Opening Songs" }
      section2_json = playlist_json["playlist_sections"].find { |s| s["name"] == "Worship Time" }

      expect(section1_json["playlist_items"].length).to eq(2)
      expect(section2_json["playlist_items"].length).to eq(2)

      # Verify songs are properly nested
      expect(section1_json["playlist_items"].first["song"]["title"]).to eq("Song 1")
      expect(section2_json["playlist_items"].last["song"]["title"]).to eq("Song 4")
    end

    it "properly serializes sections in show action" do
      get "/api/v1/playlists/#{playlist.id}"

      json_response = JSON.parse(response.body)

      expect(json_response["playlist_sections"].length).to eq(2)

      section1_json = json_response["playlist_sections"].find { |s| s["name"] == "Opening Songs" }
      section2_json = json_response["playlist_sections"].find { |s| s["name"] == "Worship Time" }

      expect(section1_json).to be_present
      expect(section2_json).to be_present
      expect(section1_json["name"]).to eq("Opening Songs")
      expect(section2_json["name"]).to eq("Worship Time")
    end
  end
end
