class CreateVolunteerServices < ActiveRecord::Migration[8.1]
  def change
    create_table :volunteer_services do |t|
      t.string :title
      t.text :description
      t.string :category
      t.string :status
      t.date :start_date
      t.date :end_date

      t.timestamps
    end
  end
end
