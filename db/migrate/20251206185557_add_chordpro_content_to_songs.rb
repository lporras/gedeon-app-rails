class AddChordproContentToSongs < ActiveRecord::Migration[7.0]
  def change
    add_column :songs, :chordpro_content, :text
  end
end
