class CreateTechnicians < ActiveRecord::Migration[8.1]
  def change
    create_table :technicians do |t|
      t.string :name
      t.string :phone
      t.string :specialty
      t.boolean :active, default: true

      t.timestamps
    end
    add_index :technicians, :name
  end
end
