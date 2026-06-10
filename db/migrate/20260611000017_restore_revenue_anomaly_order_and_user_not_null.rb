class RestoreRevenueAnomalyOrderAndUserNotNull < ActiveRecord::Migration[8.1]
  def change
    change_column_null :revenue_anomalies, :order_id, false
    change_column_null :revenue_anomalies, :user_id, false
  end
end
