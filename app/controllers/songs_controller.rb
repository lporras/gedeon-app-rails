class SongsController < ApplicationController
  def chords_modal
    @song = Song.find(params[:id])
    render layout: false
  end

  def video_modal
    @song = Song.find(params[:id])
    render layout: false
  end
end
