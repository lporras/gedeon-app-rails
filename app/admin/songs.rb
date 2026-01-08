require 'video_player'

ActiveAdmin.register Song do
  menu priority: 3

  permit_params :title, :content, :position, :author, :chordpro_content,
                video_links_attributes: [
                  :id,
                  :provider,
                  :url,
                  :_destroy
                ]

  filter :title
  filter :content
  filter :position
  filter :created_at
  filter :updated_at

  index do
    selectable_column
    id_column
    column :title
    column :content do |song|
      div song.content, style: "max-width: 25rem"
    end
    column :author
    column :position
    column :created_at
    column :updated_at

    actions
  end

  form partial: 'form'

  show do
    attributes_table do
      row :position
      row :title
      row :content do |song|
        simple_format song.content
      end
      row :author

      # Add ChordPro preview if content exists
      if song.chordpro_content.present?
        row :chordpro_preview do |song|
          div class: 'chordpro-show-preview',
              'data-controller': 'chordpro-preview' do
            # Hidden textarea for Stimulus controller
            textarea song.chordpro_content,
                     style: 'display: none;',
                     'data-chordpro-preview-target': 'input'

            # Preview panel (auto-renders on connect)
            div 'data-chordpro-preview-target': 'preview' do
            end
          end
        end
      end

      row :video_links do |song|
        song.video_links.each do |video_link|
          div do
            raw VideoPlayer::player(video_link.url)
          end
        end
      end

      row :created_at
      row :updated_at
    end

    div do
      h2 do
        "Slide"
      end
      iframe src: slide_admin_song_path(song), width: "100%", height: 500 do
      end
    end
    active_admin_comments
  end

  member_action :slide, method: :get do
    @song = resource

    respond_to do |format|
      format.html { render layout: "reveal_js" }
    end
  end
end
