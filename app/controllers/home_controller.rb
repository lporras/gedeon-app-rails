class HomeController < ApplicationController
  def show
    redirect_to home_redirect_url
  end

  def app
    @q = Song.ransack(params[:q])
    @songs = @q.result(distinct: true).order(title: :asc).all
    @playlists = Playlist.active.order(name: :asc)
  end

  def show_playlist
    @playlist = Playlist.active.find(params[:id])
  end

  private

  def home_redirect_url
    ENV.fetch("HOME_REDIRECT_TO") { "/app" }
  end
end
