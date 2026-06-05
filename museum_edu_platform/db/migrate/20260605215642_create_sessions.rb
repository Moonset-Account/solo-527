class CreateSessions < ActiveRecord::Migration[8.0]
  def change
    create_table :sessions do |t|
      t.references :course, null: false, foreign_key: true
      t.datetime :start_at
      t.datetime :end_at
      t.string :location
      t.integer :capacity
      t.integer :registered_count
      t.integer :status
      t.text :notes
      t.string :qr_code_token

      t.timestamps
    end
    add_index :sessions, :status
    add_index :sessions, :qr_code_token
  end
end
