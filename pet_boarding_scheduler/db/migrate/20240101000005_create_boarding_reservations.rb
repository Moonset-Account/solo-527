class CreateBoardingReservations < ActiveRecord::Migration[8.1]
  def change
    create_table :boarding_reservations do |t|
      t.references :pet, null: false, foreign_key: true
      t.references :caretaker, null: false, foreign_key: true
      t.references :kennel, null: false, foreign_key: true
      t.datetime :check_in_at, null: false
      t.datetime :check_out_at
      t.integer :status, default: 0
      t.decimal :total_price, precision: 10, scale: 2, default: 0.0
      t.text :notes
      t.text :special_requests

      t.timestamps
    end

    add_index :boarding_reservations, :status
    add_index :boarding_reservations, :check_in_at
    add_index :boarding_reservations, :check_out_at
  end
end
