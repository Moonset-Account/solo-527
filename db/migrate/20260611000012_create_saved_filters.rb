class CreateSavedFilters < ActiveRecord::Migration[8.1]
  def change
    create_table :saved_filters do |t|
      t.references :user, null: false, foreign_key: true
      t.string :filterable_type, null: false
      t.string :name, null: false
      t.jsonb :conditions, default: {}, null: false

      t.timestamps
    end

    add_index :saved_filters, [:user_id, :filterable_type]
  end
end
