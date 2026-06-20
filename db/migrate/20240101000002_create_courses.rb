class CreateCourses < ActiveRecord::Migration[8.1]
  def change
    create_table :courses do |t|
      t.string :name, null: false
      t.text :description
      t.integer :capacity, null: false, default: 0
      t.integer :enrolled_count, null: false, default: 0
      t.decimal :price, precision: 10, scale: 2, default: 0.0
      t.string :level
      t.string :coach
      t.datetime :start_date
      t.datetime :end_date
      t.string :schedule_info
      t.string :status, null: false, default: "active"
      t.bigint :venue_id, index: true

      t.timestamps
    end

    add_index :courses, :status
    add_index :courses, :level
    add_index :courses, :start_date
  end
end
