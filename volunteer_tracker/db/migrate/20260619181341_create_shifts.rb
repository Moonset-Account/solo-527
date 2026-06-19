class CreateShifts < ActiveRecord::Migration[8.1]
  def change
    create_table :shifts do |t|
      t.string :title
      t.text :description
      t.datetime :start_time
      t.datetime :end_time
      t.integer :capacity
      t.string :status

      t.timestamps
    end
  end
end
