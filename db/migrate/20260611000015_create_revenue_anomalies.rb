class CreateRevenueAnomalies < ActiveRecord::Migration[8.1]
  def change
    create_table :revenue_anomalies do |t|
      t.references :event, null: false, foreign_key: true
      t.references :order, null: false, foreign_key: true
      t.references :user, null: false, foreign_key: true
      t.string :anomaly_type, null: false
      t.decimal :amount, precision: 10, scale: 2, null: false, default: 0
      t.text :description
      t.string :status, default: "open", null: false
      t.datetime :detected_at
      t.references :resolved_by, null: true, foreign_key: { to_table: :users }
      t.datetime :resolved_at

      t.timestamps
    end

    add_index :revenue_anomalies, :status
    add_index :revenue_anomalies, :anomaly_type
  end
end
