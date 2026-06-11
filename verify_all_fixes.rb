puts "="*60
puts "综合业务流程验证 - 口腔洁牙候补队列平台"
puts "="*60

doctor = Doctor.first
customer = Customer.where(vip: false).first
vip_customer = Customer.where(vip: true).first
time_slot = doctor.time_slots.where("start_time > ?", Time.current).where("start_time < ?", 2.days.from_now).order(:start_time).first
service_item = ServiceItem.first

puts "\n[1] 基础数据检查"
puts "  Doctor: #{doctor.name}, TimeSlots: #{doctor.time_slots.count}"
puts "  Customer: #{customer.name}, VIP: #{customer.vip}"
puts "  VIP Customer: #{vip_customer&.name}"
puts "  TimeSlot: #{time_slot&.start_time}, capacity: #{time_slot&.capacity}, booked: #{time_slot&.booked_count}"
puts "  ServiceItem: #{service_item&.name}, price: #{service_item&.price}"
puts "  WaitingListRules: #{WaitingListRule.count}, default: #{WaitingListRule.default_rule&.name}"

puts "\n[2] 测试候补入队 + 转化追踪"
wl1 = WaitingList.add_customer(customer, doctor, time_slot: time_slot, service_item: service_item)
wl2 = WaitingList.add_customer(vip_customer, doctor, time_slot: time_slot, service_item: service_item)
puts "  普通客户入队: position=#{wl1.position}, vip=#{wl1.vip_priority}, code=#{wl1.tracking_code}"
puts "  VIP客户入队: position=#{wl2.position}, vip=#{wl2.vip_priority}, code=#{wl2.tracking_code}"

appointment_from_wl = wl2.convert_to_appointment!(service_items: [service_item], operator: "测试前台")
puts "  VIP候补转化预约: #{appointment_from_wl.appointment_no}"
puts "    from_waiting_list: #{appointment_from_wl.from_waiting_list?}"
puts "    source: #{appointment_from_wl.source}"
puts "    waiting_list_tracking: #{appointment_from_wl.waiting_list.tracking_code}"
puts "    候补状态: #{wl2.reload.status}"
puts "  普通客户候补新位置: #{wl1.reload.position}"

puts "\n[3] 测试候补变化日志（前后快照）"
snapshots = wl2.reload.before_after_snapshots
puts "  #{wl2.tracking_code} 快照数: #{snapshots.count}"
snapshots.each do |s|
  puts "    [#{s[:change_type]}] #{s[:changed_at].strftime('%H:%M:%S')} " \
       "pos: #{s[:before][:position]}→#{s[:after][:position]}, " \
       "status: #{s[:before][:status]}→#{s[:after][:status]}"
end

puts "\n[4] 测试预约单据详情（对账数据）"
detailed = appointment_from_wl.detailed_record
puts "  预约单: #{detailed[:appointment_no]}"
puts "  服务项目数: #{detailed[:service_items].count}"
puts "  退款记录数: #{detailed[:refund_records].count}"
puts "  候补历史数: #{detailed[:waiting_list_history].count}"
recon = appointment_from_wl.reconciliation_data
puts "  对账: net=#{recon[:net_amount]}, refunds=#{recon[:refund_count]}, from_wl=#{recon[:from_waiting_list]}"

puts "\n[5] 测试批量操作预览与字段校验"
pending_appointments = Appointment.where(status: "pending").limit(3)
ids = pending_appointments.pluck(:id)
puts "  选中 #{pending_appointments.count} 条待确认预约: IDs=#{ids.join(',')}"
preview = BatchOperationLog.new.preview(pending_appointments, {"status" => "confirmed", "operator" => "批量测试员"})
puts "  预览结果:"
preview.each do |p|
  status_tag = p[:valid] ? "✅ 通过" : "❌ 错误: #{p[:errors]}"
  puts "    #{p[:record_type]}##{p[:record_id]}: #{p[:original]} → #{p[:changes]} #{status_tag}"
end

puts "\n[6] 测试批量操作实际执行"
batch = BatchOperationLog.execute(
  "bulk_update_appointment",
  pending_appointments,
  {"status" => "confirmed", "operator" => "批量测试员"},
  operator: "测试管理员"
)
puts "  批量结果: success=#{batch.success_count}, failed=#{batch.failed_count}"
puts "  批次号: #{batch.batch_no}"
batch.batch_operation_items.each do |item|
  tag = item.success ? "✅" : "❌ #{item.field_errors}"
  puts "    #{item.record_type}##{item.record_id}: #{tag}"
end

puts "\n[7] 测试 Sidekiq Jobs 可执行性"
begin
  result = WaitingListAutoReleaseJob.perform_now
  puts "  WaitingListAutoReleaseJob 执行成功: #{result}"
rescue => e
  puts "  ❌ WaitingListAutoReleaseJob 错误: #{e.message}"
  puts e.backtrace.first(3).join("\n")
end

test_wl = wl1
begin
  WaitingListNotificationJob.perform_now(test_wl.id)
  puts "  WaitingListNotificationJob 执行成功: notified_at=#{test_wl.reload.notified_at}"
  puts "    状态: #{test_wl.status}"
rescue => e
  puts "  ❌ WaitingListNotificationJob 错误: #{e.message}"
  puts e.backtrace.first(5).join("\n")
end

begin
  result = AppointmentReminderJob.perform_now
  puts "  AppointmentReminderJob 执行成功"
rescue => e
  puts "  ❌ AppointmentReminderJob 错误: #{e.message}"
end

begin
  result = AppointmentNoShowCheckJob.perform_now
  puts "  AppointmentNoShowCheckJob 执行成功"
rescue => e
  puts "  ❌ AppointmentNoShowCheckJob 错误: #{e.message}"
end

puts "\n" + "="*60
puts "所有验证完成！"
puts "="*60
