class RevenueAnomalyJob < ApplicationJob
  queue_as :default

  def perform(event_id)
    event = Event.find(event_id)
    AnomalyDetector.new.check_event(event)
  end
end
