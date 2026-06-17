class ConsumableCheckJob < ApplicationJob
  queue_as :notifications

  def perform
    ConsumableRule.active_only.find_each do |rule|
      rule.treatment.treatment_card_items.find_each do |item|
        next unless rule.matches?(item)
        notification = Notification.create_consumable_alert!(item, rule)
        TodoItem.create_from_urgent_notification!(notification)
      end
    end
  end
end
