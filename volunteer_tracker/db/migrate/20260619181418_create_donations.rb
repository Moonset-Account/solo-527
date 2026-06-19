class CreateDonations < ActiveRecord::Migration[8.1]
  def change
    create_table :donations do |t|
      t.string :donor_name
      t.string :donor_contact
      t.decimal :amount
      t.string :donation_type
      t.references :material, foreign_key: true
      t.integer :quantity
      t.string :status
      t.text :remark

      t.timestamps
    end
  end
end
