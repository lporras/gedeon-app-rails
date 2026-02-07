class CreateSchedulesAndScheduleItems < ActiveRecord::Migration[7.0]
  def change
    create_table :schedules do |t|
      t.string :name
      t.references :account, foreign_key: true
      t.timestamps
    end

    create_table :schedule_items do |t|
      t.references :schedule, null: false, foreign_key: true
      t.string :item_type, null: false
      t.bigint :item_id, null: false
      t.integer :position, default: 0
      t.timestamps
    end

    add_index :schedule_items, [:item_type, :item_id]
  end
end
