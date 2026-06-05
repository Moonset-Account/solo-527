class CreateTeachers < ActiveRecord::Migration[8.0]
  def change
    create_table :teachers do |t|
      t.references :user, null: false, foreign_key: true, index: { unique: true }
      t.string :bio
      t.string :specialties, array: true, default: []
      t.decimal :hourly_rate, precision: 10, scale: 2, null: false, default: 0
      t.string :bank_account
      t.string :id_card
      t.integer :status, null: false, default: 0
      t.date :hire_date
      t.jsonb :skills, default: {}
      t.timestamps
    end
  end
end
