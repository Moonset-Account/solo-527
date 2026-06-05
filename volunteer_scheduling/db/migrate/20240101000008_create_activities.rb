class CreateActivities < ActiveRecord::Migration[8.0]
  def change
    create_table :activities do |t|
      t.string :title, null: false
      t.text :description
      t.references :project_manager, null: false, foreign_key: { to_table: :users }
      t.datetime :start_time, null: false
      t.datetime :end_time, null: false
      t.integer :status, default: 0
      t.string :category
      t.integer :volunteers_needed, default: 1

      t.timestamps
    end
  end
end
