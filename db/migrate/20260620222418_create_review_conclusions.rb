class CreateReviewConclusions < ActiveRecord::Migration[8.1]
  def change
    create_table :review_conclusions do |t|
      t.references :ticket, null: false, foreign_key: true
      t.text :content
      t.text :root_cause
      t.text :improvement
      t.text :result
      t.integer :efficiency_before, default: 50
      t.integer :efficiency_after, default: 50
      t.references :reviewer, null: false, foreign_key: { to_table: :users }
      t.datetime :reviewed_at

      t.timestamps
    end

    add_index :review_conclusions, :created_at
  end
end
