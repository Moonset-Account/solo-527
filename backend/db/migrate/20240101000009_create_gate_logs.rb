class CreateGateLogs < ActiveRecord::Migration[8.0]
  def change
    create_table :gate_logs do |t|
      t.references :pass, foreign_key: true
      t.references :person, foreign_key: true
      t.references :vehicle, foreign_key: true
      t.string :gate_name, null: false
      t.string :action, null: false
      t.datetime :logged_at, null: false
      t.references :operator, foreign_key: { to_table: :users }
      t.string :result, null: false
      t.text :remark
      t.string :temperature
      t.string :id_card_verified
      t.string :photo_match_result

      t.timestamps
    end
    add_index :gate_logs, :logged_at
  end
end
