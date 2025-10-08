require 'rails_helper'

RSpec.describe "Api::V1::Songs", type: :request do
  # The API controller sets a default tenant to "ici-santiago" subdomain
  # So we create that account and test data belongs to it
  let!(:account) { create(:account, subdomain: "ici-santiago") }

  describe "GET /api/v1/songs" do
    context "with songs in the default tenant" do
      let!(:song1) { ActsAsTenant.with_tenant(account) { create(:song, title: "Amazing Grace") } }
      let!(:song2) { ActsAsTenant.with_tenant(account) { create(:song, title: "Blessed Assurance") } }
      let!(:video_link1) { ActsAsTenant.with_tenant(account) { create(:video_link, url: "https://youtube.com/watch?v=123") } }

      let!(:song1_video_association) do
        ActsAsTenant.with_tenant(account) { song1.video_links << video_link1 }
      end

      it "returns all songs from the default tenant ordered by title" do
        get "/api/v1/songs"

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)

        expect(json_response.length).to eq(2)
        expect(json_response.first["title"]).to eq("Amazing Grace")
        expect(json_response.second["title"]).to eq("Blessed Assurance")
      end

      it "includes video_links in the serialized response" do
        get "/api/v1/songs"

        json_response = JSON.parse(response.body)
        song_with_video = json_response.find { |s| s["id"] == song1.id }

        expect(song_with_video["video_links"]).to be_present
        expect(song_with_video["video_links"].length).to eq(1)
        expect(song_with_video["video_links"].first["url"]).to eq("https://youtube.com/watch?v=123")
      end

      context "SongSerializer coverage" do
        it "serializes all song attributes correctly" do
          get "/api/v1/songs"

          json_response = JSON.parse(response.body)
          song_json = json_response.first

          # Verify all SongSerializer attributes
          expect(song_json).to have_key("id")
          expect(song_json).to have_key("title")
          expect(song_json).to have_key("content")
          expect(song_json).to have_key("position")
          expect(song_json).to have_key("video_links")
          expect(song_json).to have_key("created_at")
          expect(song_json).to have_key("updated_at")

          expect(song_json["id"]).to eq(song1.id)
          expect(song_json["title"]).to eq(song1.title)
        end

        it "serializes video_links with VideoLinkSerializer" do
          get "/api/v1/songs"

          json_response = JSON.parse(response.body)
          song_with_video = json_response.find { |s| s["id"] == song1.id }
          video_link_json = song_with_video["video_links"].first

          # Verify all VideoLinkSerializer attributes
          expect(video_link_json).to have_key("id")
          expect(video_link_json).to have_key("provider")
          expect(video_link_json).to have_key("video_id")
          expect(video_link_json).to have_key("url")

          expect(video_link_json["id"]).to eq(video_link1.id)
          expect(video_link_json["url"]).to eq(video_link1.url)
        end
      end
    end

    context "when no songs exist" do
      it "returns an empty array" do
        get "/api/v1/songs"

        expect(response).to have_http_status(:ok)
        json_response = JSON.parse(response.body)
        expect(json_response).to eq([])
      end
    end
  end

  describe "GET /api/v1/songs/:id" do
    let!(:song) { ActsAsTenant.with_tenant(account) { create(:song, title: "Test Song", content: "Test content") } }
    let!(:video_link) { ActsAsTenant.with_tenant(account) { create(:video_link, url: "https://youtube.com/watch?v=abc") } }

    let!(:song_video_association) do
      ActsAsTenant.with_tenant(account) { song.video_links << video_link }
    end

    it "returns the requested song from the default tenant" do
      get "/api/v1/songs/#{song.id}"

      expect(response).to have_http_status(:ok)
      json_response = JSON.parse(response.body)

      expect(json_response["id"]).to eq(song.id)
      expect(json_response["title"]).to eq("Test Song")
      expect(json_response["content"]).to eq("Test content")
    end

    it "includes video_links in the response" do
      get "/api/v1/songs/#{song.id}"

      json_response = JSON.parse(response.body)

      expect(json_response["video_links"]).to be_present
      expect(json_response["video_links"].length).to eq(1)
      expect(json_response["video_links"].first["url"]).to eq("https://youtube.com/watch?v=abc")
    end

    it "raises error when song does not exist" do
      expect {
        get "/api/v1/songs/99999"
      }.to raise_error(ActiveRecord::RecordNotFound)
    end

    context "SongSerializer coverage" do
      it "serializes all attributes correctly" do
        get "/api/v1/songs/#{song.id}"

        json_response = JSON.parse(response.body)

        # Verify all SongSerializer attributes
        expect(json_response).to have_key("id")
        expect(json_response).to have_key("title")
        expect(json_response).to have_key("content")
        expect(json_response).to have_key("position")
        expect(json_response).to have_key("video_links")
        expect(json_response).to have_key("created_at")
        expect(json_response).to have_key("updated_at")

        expect(json_response["id"]).to eq(song.id)
        expect(json_response["title"]).to eq(song.title)
        expect(json_response["content"]).to eq(song.content)
        expect(json_response["position"]).to eq(song.position)
      end
    end
  end

  describe "tenant isolation" do
    let(:other_account) { create(:account, subdomain: "other-account") }
    let!(:account_song) { ActsAsTenant.with_tenant(account) { create(:song, title: "Default Account Song") } }
    let!(:other_account_song) { ActsAsTenant.with_tenant(other_account) { create(:song, title: "Other Account Song") } }

    it "only returns songs from the default tenant (ici-santiago)" do
      get "/api/v1/songs"
      json_response = JSON.parse(response.body)

      # Should include the default account's song
      expect(json_response.map { |s| s["id"] }).to include(account_song.id)
      # Should not include other account's song
      expect(json_response.map { |s| s["id"] }).not_to include(other_account_song.id)
    end

    it "raises error when trying to access song from another tenant" do
      expect {
        get "/api/v1/songs/#{other_account_song.id}"
      }.to raise_error(ActiveRecord::RecordNotFound)
    end
  end

  describe "with multiple video links" do
    let!(:song) { ActsAsTenant.with_tenant(account) { create(:song, title: "Song with Videos") } }
    let!(:video1) { ActsAsTenant.with_tenant(account) { create(:video_link, url: "https://youtube.com/watch?v=abc") } }
    let!(:video2) { ActsAsTenant.with_tenant(account) { create(:video_link, url: "https://youtube.com/watch?v=def") } }

    let!(:song_videos_association) do
      ActsAsTenant.with_tenant(account) do
        song.video_links << video1
        song.video_links << video2
      end
    end

    it "serializes all video links correctly" do
      get "/api/v1/songs/#{song.id}"

      json_response = JSON.parse(response.body)

      expect(json_response["video_links"].length).to eq(2)
      expect(json_response["video_links"].map { |v| v["url"] }).to contain_exactly(
        "https://youtube.com/watch?v=abc",
        "https://youtube.com/watch?v=def"
      )
    end
  end
end
