class CreateUsers < ActiveRecord::Migration[8.0]
  def change
    create_table :users do |t|
      t.string :phone, null: false, index: { unique: true }
      t.string :email
      t.string :name, null: false
      t.string :avatar_url
      t.string :password_digest, null: false
      t.integer :role, null: false, default: 0
      t.string :wechat_openid
      t.datetime :last_login_at
      t.boolean :is_active, null: false, default: true
      t.jsonb :metadata, default: {}
      t.timestamps
    end
  end
end
