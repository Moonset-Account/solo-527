class CreateSessionGuides < ActiveRecord::Migration[8.0]
  def change
    create_table :session_guides do |t|
      t.references :session, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :role
      t.integer :status
      t.text :notes

      t.timestamps
    end
    add_index :session_guides, :status
  end
end
