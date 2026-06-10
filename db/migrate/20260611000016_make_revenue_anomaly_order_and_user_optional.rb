class MakeRevenueAnomalyOrderAndUserOptional < ActiveRecord::Migration[8.1]
  def change
    change_column_null :revenue_anomalies, :order_id, true
    change_column_null :revenue_anomalies, :user_id, true
  end
end
