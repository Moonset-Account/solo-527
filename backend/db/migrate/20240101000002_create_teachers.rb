class CreateTeachers < ActiveRecord::Migration[8.0]
  def change
    create_table :teachers do |t|
      t.references :user, null: false, foreign_key: true
      t.string :name, null: false
      t.string :avatar
      t.text :bio
      t.string :specialty, array: true, default: []
      t.decimal :hourly_rate, precision: 10, scale: 2, default: 0.0
      t.string :status, null: false, default: 'active'

      t.timestamps
    end

    add_index :teachers, :status
  end
end
