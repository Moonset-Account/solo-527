class CreateVenueBookings < ActiveRecord::Migration[8.1]
  def change
    create_table :venue_bookings do |t|
      t.references :venue, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.references :bookable, polymorphic: true
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.string :purpose
      t.string :status, null: false, default: "confirmed"
      t.text :remark
      t.string :source

      t.timestamps
    end

    add_index :venue_bookings, [:venue_id, :start_time]
    add_index :venue_bookings, :status
    add_index :venue_bookings, [:bookable_type, :bookable_id]
  end
end
