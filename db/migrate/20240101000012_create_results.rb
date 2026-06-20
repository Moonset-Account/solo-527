class CreateResults < ActiveRecord::Migration[8.1]
  def change
    create_table :results do |t|
      t.references :event_registration, null: false, foreign_key: true
      t.references :schedule, foreign_key: true
      t.integer :rank
      t.string :time_result
      t.decimal :score, precision: 10, scale: 2
      t.string :status, default: "pending"
      t.text :remark
      t.references :operator, foreign_key: { to_table: :users }

      t.timestamps
    end

    add_index :results, :rank
    add_index :results, :status
  end
end
