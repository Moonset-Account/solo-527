class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :username, null: false
      t.string :email
      t.string :password_digest, null: false
      t.string :role, null: false, default: 'guard'
      t.string :real_name
      t.string :phone
      t.string :department
      t.boolean :active, default: true

      t.timestamps
    end
    add_index :users, :username, unique: true
  end
end
