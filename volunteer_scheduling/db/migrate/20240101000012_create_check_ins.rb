class CreateCheckIns < ActiveRecord::Migration[8.0]
  def change
    create_table :check_ins do |t|
      t.references :assignment, null: false, foreign_key: true
      t.datetime :checked_in_at
      t.datetime :checked_out_at
      t.float :service_hours, default: 0
      t.integer :status, default: 0
      t.boolean :is_late, default: false
      t.boolean :is_early_leave, default: false
      t.string :check_in_method
      t.float :check_in_latitude
      t.float :check_in_longitude
      t.text :notes
      t.boolean :needs_review, default: false
      t.text :review_reason

      t.timestamps
    end
  end
end
