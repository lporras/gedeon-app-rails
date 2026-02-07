class AddNameToScheduleImages < ActiveRecord::Migration[7.0]
  def change
    add_column :schedule_images, :name, :string
  end
end
