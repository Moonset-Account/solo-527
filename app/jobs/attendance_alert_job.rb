class AttendanceAlertJob < ApplicationJob
  queue_as :default

  def perform(event_id, schedule_id = nil)
    event = Event.find(event_id)
    AttendanceService.new.detect_gaps(event, schedule_id ? Schedule.find(schedule_id) : nil)
  end
end
