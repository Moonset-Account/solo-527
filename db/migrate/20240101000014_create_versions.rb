class CreateVersions < ActiveRecord::Migration[8.1]
  def change
    create_table :versions do |t|
      t.string   :item_type, null: false
      t.bigint   :item_id,   null: false
      t.string   :event,     null: false
      t.string   :whodunnit
      t.text     :object
      t.datetime :created_at
      t.text     :object_changes
      t.string   :transaction_id
    end

    add_index :versions, [:item_type, :item_id]
    add_index :versions, [:transaction_id]
  end
end
