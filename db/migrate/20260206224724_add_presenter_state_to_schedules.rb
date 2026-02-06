class AddPresenterStateToSchedules < ActiveRecord::Migration[7.0]
  def change
    add_column :schedules, :presenter_state, :jsonb
  end
end
