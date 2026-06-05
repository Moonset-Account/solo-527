class CreateCheckInReviews < ActiveRecord::Migration[8.0]
  def change
    create_table :check_in_reviews do |t|
      t.references :check_in, null: false, foreign_key: true
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.integer :decision, null: false
      t.text :review_notes
      t.datetime :reviewed_at, null: false

      t.timestamps
    end
  end
end
