class CreateRegistrations < ActiveRecord::Migration[8.0]
  def change
    create_table :registrations do |t|
      t.references :session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :school, null: false, foreign_key: true
      t.integer :registration_type
      t.integer :status
      t.integer :student_count
      t.string :contact_name
      t.string :contact_phone
      t.string :contact_email
      t.text :notes
      t.datetime :submitted_at
      t.datetime :approved_at
      t.datetime :rejected_at
      t.text :rejection_reason
      t.string :qr_token

      t.timestamps
    end
    add_index :registrations, :registration_type
    add_index :registrations, :status
    add_index :registrations, :qr_token
  end
end
