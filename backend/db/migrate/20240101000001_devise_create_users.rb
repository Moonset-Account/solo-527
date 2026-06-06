class DeviseCreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :provider, null: false, default: 'email'
      t.string :uid, null: false, default: ''

      t.string :name, null: false
      t.string :email, null: false
      t.string :phone
      t.string :role, null: false, default: 'student'
      t.string :avatar

      t.string :encrypted_password, null: false, default: ''

      t.string :reset_password_token
      t.datetime :reset_password_sent_at

      t.datetime :remember_created_at

      t.integer :sign_in_count, default: 0, null: false
      t.datetime :current_sign_in_at
      t.datetime :last_sign_in_at
      t.string :current_sign_in_ip
      t.string :last_sign_in_ip

      t.string :confirmation_token
      t.datetime :confirmed_at
      t.datetime :confirmation_sent_at
      t.string :unconfirmed_email

      t.integer :failed_attempts, default: 0, null: false
      t.string :unlock_token
      t.datetime :locked_at

      t.timestamps null: false
    end

    add_index :users, :email, unique: true
    add_index :users, [:uid, :provider], unique: true
    add_index :users, :reset_password_token, unique: true
    add_index :users, :confirmation_token, unique: true
    add_index :users, :unlock_token, unique: true
    add_index :users, :role
  end
end
