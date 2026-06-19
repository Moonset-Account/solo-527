class LowStockAlertJob < ApplicationJob
  queue_as :default

  def perform
    Material.find_each do |material|
      next unless material.below_threshold?

      TrackingReminder.create!(
        trackable: material,
        reminder_type: 'low_stock',
        reminder_date: Date.today,
        message: "物资 #{material.name} 库存不足，当前库存 #{material.current_quantity}，低于阈值 #{material.threshold}"
      )
    end
  end
end
