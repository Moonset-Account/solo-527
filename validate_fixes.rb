require_relative 'config/environment'

puts '=== 1. Tailwind Asset ==='
puts 'tailwind.css exists: ' + File.exist?('app/assets/builds/tailwind.css').to_s
puts 'tailwind.css size: ' + File.size('app/assets/builds/tailwind.css').to_s

puts "\n=== 2. RevenueService consistency ==="
event = Event.first
svc = RevenueService.new
puts 'event_revenue: ' + svc.event_revenue(event).inspect
puts 'refund_rate: ' + svc.refund_rate(event).to_s
puts 'TicketType#orders exists: ' + TicketType.first.respond_to?(:orders).to_s

puts "\n=== 3. Check all model instance variables that views expect ==="

# Simulate each controller's index action and check variables
puts "\n--- AttendanceController ---"
begin
  user = User.ops_staff.first
  @events = Event.published.recent
  @selected_event = @events.first
  if @selected_event
    @attendance_rate = AttendanceService.new.attendance_rate(@selected_event)
    @registrations = @selected_event.registrations.approved.includes(:attendance, :user, :schedule, :event)
    @attendances = Attendance.where(registration: @selected_event.registrations.approved).includes(registration: [:user, :schedule, :event]).order(created_at: :desc)
    @alerts = AttendanceAlert.where(event: @selected_event).recent
    @open_alerts_count = @alerts.open.count
  else
    @attendances = Attendance.none
    @open_alerts_count = 0
  end
  puts '@attendances: ' + (@attendances.respond_to?(:count) ? @attendances.count.to_s : 'nil')
  puts '@open_alerts_count: ' + @open_alerts_count.to_s
  puts '@selected_event: ' + (@selected_event&.title || 'nil').to_s
rescue => e
  puts "ERROR: #{e.class}: #{e.message}"
end

puts "\n--- AttendanceAlertsController ---"
begin
  @attendance_alerts = AttendanceAlert.includes(:event, :schedule).recent
  puts '@attendance_alerts: ' + (@attendance_alerts.respond_to?(:count) ? @attendance_alerts.count.to_s : 'nil')
rescue => e
  puts "ERROR: #{e.class}: #{e.message}"
end

puts "\n--- RevenueAnomaliesController ---"
begin
  @revenue_anomalies = RevenueAnomaly.includes(:event, :order, :user, :resolved_by).recent
  puts '@revenue_anomalies: ' + (@revenue_anomalies.respond_to?(:count) ? @revenue_anomalies.count.to_s : 'nil')
rescue => e
  puts "ERROR: #{e.class}: #{e.message}"
end

puts "\n--- BatchOperationsController#show ---"
begin
  bo = BatchOperation.first
  if bo
    @batch_operation = BatchOperation.includes(:user, audit_logs: :user).find(bo.id)
    puts '@batch_operation: id=' + @batch_operation.id.to_s
  else
    puts 'No BatchOperation in DB'
  end
rescue => e
  puts "ERROR: #{e.class}: #{e.message}"
end

puts "\n=== DONE ==="
