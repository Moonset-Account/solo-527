class CreateGuides < ActiveRecord::Migration[8.0]
  def change
    create_table :guides do |t|
      t.string :name, null: false
      t.string :phone, null: false
      t.string :email
      t.string :employee_id
      t.text :specialties
      t.integer :status, null: false, default: 0
      t.datetime :deleted_at

      t.timestamps
    end
    add_index :guides, :status
    add_index :guides, :deleted_at
    add_index :guides, :employee_id, unique: true
  end
end
