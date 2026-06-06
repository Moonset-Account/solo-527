class DeviseTokenAuthCreateUsers < ActiveRecord::Migration[8.0]
  def change
    add_column :users, :allow_password_change, :boolean, default: false
    add_column :users, :tokens, :json
  end
end
