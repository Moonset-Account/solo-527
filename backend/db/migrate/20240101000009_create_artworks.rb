class CreateArtworks < ActiveRecord::Migration[8.0]
  def change
    create_table :artworks do |t|
      t.references :student, null: false, foreign_key: true
      t.references :course_session, foreign_key: true
      t.references :teacher, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.string :image_urls, array: true, default: []
      t.string :thumbnail_url
      t.boolean :is_public, null: false, default: false
      t.datetime :published_at
      t.integer :likes_count, null: false, default: 0
      t.integer :views_count, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.jsonb :tags, default: []
      t.timestamps
    end
    add_index :artworks, [:student_id, :is_public]
    add_index :artworks, [:is_public, :status]
  end
end
