schedule = {
  "waiting_list_auto_release" => {
    "class" => "WaitingListAutoReleaseJob",
    "cron"  => "*/5 * * * *",
    "description" => "每5分钟检查一次候补队列自动释放"
  },
  "appointment_reminder" => {
    "class" => "AppointmentReminderJob",
    "cron"  => "0 9 * * *",
    "description" => "每天早上9点发送预约提醒"
  },
  "appointment_no_show_check" => {
    "class" => "AppointmentNoShowCheckJob",
    "cron"  => "*/15 * * * *",
    "description" => "每15分钟检查一次爽约记录"
  }
}

Sidekiq.configure_server do |config|
  config.on(:startup) do
    Sidekiq::Cron::Job.load_from_hash(schedule)
  end
end if defined?(Sidekiq::Cron)
