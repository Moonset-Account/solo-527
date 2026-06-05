class CreateCourseCategories < ActiveRecord::Migration[8.0]
  def change
    create_table :course_categories do |t|
      t.string :name, null: false
      t.string :code, null: false, index: { unique: true }
      t.string :description
      t.string :icon_url
      t.integer :sort_order, null: false, default: 0
      t.boolean :is_active, null: false, default: true
      t.timestamps
    end
  end
end
