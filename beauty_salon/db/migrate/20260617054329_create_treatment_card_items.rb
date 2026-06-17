class CreateTreatmentCardItems < ActiveRecord::Migration[8.1]
  def change
    create_table :treatment_card_items do |t|
      t.references :treatment_card, null: false, foreign_key: true
      t.references :treatment, null: false, foreign_key: true
      t.integer :total_sessions
      t.integer :remaining_sessions

      t.timestamps
    end
  end
end
