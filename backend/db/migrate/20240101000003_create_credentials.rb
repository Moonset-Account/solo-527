class CreateCredentials < ActiveRecord::Migration[8.0]
  def change
    create_table :credentials do |t|
      t.references :person, null: false, foreign_key: true
      t.string :credential_type, null: false
      t.string :credential_number, null: false
      t.string :issuing_authority
      t.date :issue_date
      t.date :expiry_date
      t.string :credential_level
      t.boolean :verified, default: false
      t.datetime :verified_at
      t.references :verifier, foreign_key: { to_table: :users }

      t.timestamps
    end
    add_index :credentials, [:credential_type, :credential_number], unique: true
  end
end
