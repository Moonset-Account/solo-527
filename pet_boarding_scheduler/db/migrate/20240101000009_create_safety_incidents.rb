class CreateSafetyIncidents < ActiveRecord::Migration[8.1]
  def change
    create_table :safety_incidents do |t|
      t.references :pet, null: false, foreign_key: true
      t.references :caretaker, foreign_key: true
      t.references :kennel, foreign_key: true
      t.string :incident_type, null: false
      t.integer :severity, default: 1
      t.text :description
      t.text :action_taken
      t.datetime :occurred_at, null: false
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :safety_incidents, :incident_type
    add_index :safety_incidents, :severity
    add_index :safety_incidents, :occurred_at
  end
end
