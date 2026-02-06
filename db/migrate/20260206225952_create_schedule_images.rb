class CreateScheduleImages < ActiveRecord::Migration[7.0]
  def change
    create_table :schedule_images do |t|
      t.references :schedule, foreign_key: true
      t.string :image

      t.timestamps
    end
  end
end
