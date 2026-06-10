class CreateAttendances < ActiveRecord::Migration[8.1]
  def change
    create_table :attendances do |t|
      t.references :registration, null: false, foreign_key: true
      t.datetime :checked_in_at
      t.string :checked_in_by
      t.boolean :attended, default: false, null: false

      t.timestamps
    end
  end
end
