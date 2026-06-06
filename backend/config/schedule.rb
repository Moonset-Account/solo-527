set :output, 'log/whenever.log'
set :environment, ENV['RAILS_ENV'] || 'development'

every 1.day, at: '9:00 am' do
  runner 'ReminderJob.send_course_reminders'
end

every 1.day, at: '8:00 pm' do
  runner 'ReminderJob.send_low_stock_alerts'
end

every 1.hour do
  runner 'Enrollment.expire_pending_orders'
end

every :monday, at: '10:00 am' do
  runner 'ReportJob.send_weekly_report'
end
