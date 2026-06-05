class CreateAvailabilities < ActiveRecord::Migration[8.0]
  def change
    create_table :availabilities do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.integer :day_of_week, null: false
      t.time :start_time, null: false
      t.time :end_time, null: false
      t.boolean :recurring, default: true
      t.date :specific_date

      t.timestamps
    end
  end
end
