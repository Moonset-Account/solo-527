class CreateCheckIns < ActiveRecord::Migration[8.1]
  def change
    create_table :check_ins do |t|
      t.references :user, null: false, foreign_key: true
      t.references :checkinable, polymorphic: true, null: false
      t.datetime :checked_in_at
      t.string :status, null: false, default: "pending"
      t.string :check_in_method
      t.references :operator, foreign_key: { to_table: :users }
      t.text :remark
      t.string :source

      t.timestamps
    end

    add_index :check_ins, [:checkinable_type, :checkinable_id]
    add_index :check_ins, :status
    add_index :check_ins, :checked_in_at
  end
end
