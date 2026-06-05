class CreateCourses < ActiveRecord::Migration[8.0]
  def change
    create_table :courses do |t|
      t.references :course_category, null: false, foreign_key: true
      t.string :title, null: false
      t.text :description
      t.text :content
      t.string :cover_url
      t.string :gallery_urls, array: true, default: []
      t.integer :duration_minutes, null: false
      t.decimal :price, precision: 10, scale: 2, null: false
      t.decimal :material_fee, precision: 10, scale: 2, null: false, default: 0
      t.integer :difficulty_level, null: false, default: 1
      t.integer :min_students, null: false, default: 1
      t.integer :max_students, null: false, default: 8
      t.boolean :requires_approval, null: false, default: false
      t.boolean :is_published, null: false, default: false
      t.jsonb :tags, default: []
      t.integer :bookings_count, null: false, default: 0
      t.decimal :rating, precision: 3, scale: 2, default: 0
      t.integer :reviews_count, null: false, default: 0
      t.timestamps
    end
    add_index :courses, :is_published
    add_index :courses, :course_category_id
  end
end
