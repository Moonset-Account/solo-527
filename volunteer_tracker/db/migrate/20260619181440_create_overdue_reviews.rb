class CreateOverdueReviews < ActiveRecord::Migration[8.1]
  def change
    create_table :overdue_reviews do |t|
      t.references :visit_record, null: false, foreign_key: true
      t.text :impact_scope
      t.string :responsible_person
      t.text :conclusion
      t.date :review_date
      t.references :reviewer, foreign_key: { to_table: :users }

      t.timestamps
    end
  end
end
