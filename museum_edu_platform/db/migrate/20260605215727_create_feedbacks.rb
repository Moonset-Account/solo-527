class CreateFeedbacks < ActiveRecord::Migration[8.0]
  def change
    create_table :feedbacks do |t|
      t.references :session, null: false, foreign_key: true
      t.references :registration, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.integer :rating
      t.text :content
      t.integer :status
      t.datetime :submitted_at

      t.timestamps
    end
    add_index :feedbacks, :status
  end
end
