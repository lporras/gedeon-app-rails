class Api::V1::SongsController < Api::V1::ApiBaseController
  def show
    @song = Song.find(params[:id])
    render json: @song
  end

  def index
    render json: Song.all.includes(:video_links).order(title: :asc)
  end

  def audio_songs
    render json: Song.includes(:video_links)
      .where.not(video_links: { id: nil })
      .order(title: :asc)
      .map { |song|
        {
          id: song.id,
          title: song.title,
          author: song.author,
          video_links: song.video_links.limit(1).map { |vl|
            { id: vl.id, provider: vl.provider, video_id: vl.video_id }
          }
        }
      }
  end
end
