class CreateVisitRecords < ActiveRecord::Migration[8.1]
  def change
    create_table :visit_records do |t|
      t.references :volunteer, null: false, foreign_key: { to_table: :users }
      t.date :visit_date
      t.string :target_name
      t.string :target_address
      t.string :target_contact
      t.text :purpose
      t.text :result
      t.string :status
      t.text :next_action

      t.timestamps
    end
  end
end
