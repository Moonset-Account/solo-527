class CreateExports < ActiveRecord::Migration[8.0]
  def change
    create_table :exports do |t|
      t.bigint :user_id, null: false
      t.integer :export_type, null: false, default: 0
      t.integer :status, null: false, default: 0
      t.string :filename
      t.string :file_path
      t.bigint :file_size
      t.jsonb :filters, default: {}, null: false
      t.text :error_message

      t.timestamps
    end
    add_index :exports, :user_id
    add_index :exports, :status
    add_index :exports, :export_type
  end
end
