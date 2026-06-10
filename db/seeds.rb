admin = User.find_or_create_by!(email: "admin@ticket.com") do |u|
  u.name = "系统管理员"
  u.role = "admin"
  u.password = "admin123"
  u.password_confirmation = "admin123"
end

ops = User.find_or_create_by!(email: "ops@ticket.com") do |u|
  u.name = "运营小王"
  u.role = "ops"
  u.password = "ops12345"
  u.password_confirmation = "ops12345"
end

organizer1 = User.find_or_create_by!(email: "org1@example.com") do |u|
  u.name = "主办方张三"
  u.role = "organizer"
  u.password = "org12345"
  u.password_confirmation = "org12345"
end

organizer2 = User.find_or_create_by!(email: "org2@example.com") do |u|
  u.name = "主办方李四"
  u.role = "organizer"
  u.password = "org12345"
  u.password_confirmation = "org12345"
end

event1 = Event.find_or_create_by!(title: "星空交响音乐会") do |e|
  e.description = "一场震撼心灵的交响乐盛宴，汇聚顶级指挥家与百人乐团"
  e.starts_at = 7.days.from_now
  e.ends_at = 7.days.from_now + 3.hours
  e.venue = "国家大剧院"
  e.status = "published"
  e.created_by = admin
end

event2 = Event.find_or_create_by!(title: "爵士之夜 Live") do |e|
  e.description = "沉浸式爵士现场体验，小众音乐爱好者的天堂"
  e.starts_at = 14.days.from_now
  e.ends_at = 14.days.from_now + 2.hours
  e.venue = "蓝调酒吧"
  e.status = "published"
  e.created_by = admin
end

event3 = Event.find_or_create_by!(title: "摇滚音乐节 2026") do |e|
  e.description = "三天两夜的摇滚狂欢，十支顶级乐队轮番上阵"
  e.starts_at = 30.days.from_now
  e.ends_at = 32.days.from_now
  e.venue = "奥体中心"
  e.status = "draft"
  e.created_by = admin
end

tt1_vip = TicketType.find_or_create_by!(event: event1, name: "VIP贵宾席") do |t|
  t.price = 1280.00
  t.description = "前排最佳观演位置，含饮品"
  t.purchase_limit = 4
  t.status = "active"
end
tt1_std = TicketType.find_or_create_by!(event: event1, name: "标准席") do |t|
  t.price = 580.00
  t.description = "标准观演区域"
  t.purchase_limit = 6
  t.status = "active"
end
tt1_std.create_inventory!(total: 200, sold: 0, reserved: 0, available: 200) unless tt1_std.inventory
tt1_vip.create_inventory!(total: 50, sold: 0, reserved: 0, available: 50) unless tt1_vip.inventory

tt2 = TicketType.find_or_create_by!(event: event2, name: "入场券") do |t|
  t.price = 280.00
  t.description = "站立区域入场券"
  t.purchase_limit = 10
  t.status = "active"
end
tt2.create_inventory!(total: 100, sold: 30, reserved: 5, available: 65) unless tt2.inventory

tt3 = TicketType.find_or_create_by!(event: event3, name: "三日通票") do |t|
  t.price = 1980.00
  t.description = "三天全程通行"
  t.purchase_limit = 2
  t.status = "active"
end
tt3.create_inventory!(total: 500, sold: 0, reserved: 0, available: 500) unless tt3.inventory

schedule1 = Schedule.find_or_create_by!(event: event1, name: "上半场") do |s|
  s.starts_at = 7.days.from_now
  s.ends_at = 7.days.from_now + 1.hour + 30.minutes
  s.venue = "国家大剧院-主厅"
  s.sort_order = 1
end

schedule2 = Schedule.find_or_create_by!(event: event1, name: "下半场") do |s|
  s.starts_at = 7.days.from_now + 1.hour + 45.minutes
  s.ends_at = 7.days.from_now + 3.hours
  s.venue = "国家大剧院-主厅"
  s.sort_order = 2
end

schedule3 = Schedule.find_or_create_by!(event: event2, name: "第一场") do |s|
  s.starts_at = 14.days.from_now
  s.ends_at = 14.days.from_now + 1.hour
  s.venue = "蓝调酒吧-主舞台"
  s.sort_order = 1
end

reg1 = Registration.find_or_create_by!(event: event1, user: organizer1, schedule: schedule1) do |r|
  r.status = "approved"
  r.reviewed_at = 1.day.ago
end

reg2 = Registration.find_or_create_by!(event: event1, user: organizer2, schedule: schedule2) do |r|
  r.status = "approved"
  r.reviewed_at = 1.day.ago
end

reg3 = Registration.find_or_create_by!(event: event2, user: organizer1, schedule: schedule3) do |r|
  r.status = "pending"
end

reg4 = Registration.find_or_create_by!(event: event1, user: organizer2, schedule: schedule1) do |r|
  r.status = "pending"
end

order1 = Order.find_or_create_by!(order_no: "ORD202606110001") do |o|
  o.user = organizer1
  o.total_amount = 1280.00
  o.status = "paid"
  o.paid_at = 2.days.ago
end

Ticket.find_or_create_by!(order: order1, ticket_type: tt1_vip, ticket_no: "TKT202606110001") do |t|
  t.holder_name = "张三"
  t.status = "active"
end

order2 = Order.find_or_create_by!(order_no: "ORD202606110002") do |o|
  o.user = organizer2
  o.total_amount = 580.00
  o.status = "pending"
end

Ticket.find_or_create_by!(order: order2, ticket_type: tt1_std, ticket_no: "TKT202606110002") do |t|
  t.holder_name = "李四"
  t.status = "active"
end

order3 = Order.find_or_create_by!(order_no: "ORD202606110003") do |o|
  o.user = organizer1
  o.total_amount = 560.00
  o.status = "refunded"
  o.paid_at = 5.days.ago
end

Ticket.find_or_create_by!(order: order3, ticket_type: tt2, ticket_no: "TKT202606110003") do |t|
  t.holder_name = "张三"
  t.status = "refunded"
end

refund1 = Refund.find_or_create_by!(order: order3, user: organizer1) do |r|
  r.amount = 560.00
  r.reason = "行程冲突"
  r.status = "approved"
  r.reviewed_by = ops
  r.reviewed_at = 4.days.ago
end

Attendance.find_or_create_by!(registration: reg1) do |a|
  a.checked_in_at = 7.days.from_now
  a.checked_in_by = "运营小王"
  a.attended = true
end

AttendanceAlert.find_or_create_by!(event: event1, schedule: schedule2) do |al|
  al.expected_count = 50
  al.actual_count = 35
  al.gap_count = 15
  al.status = "open"
end

SavedFilter.find_or_create_by!(user: ops, filterable_type: "Registration", name: "待审核报名") do |f|
  f.conditions = { "status" => "pending" }
end

SavedFilter.find_or_create_by!(user: ops, filterable_type: "Inventory", name: "低库存预警") do |f|
  f.conditions = { "threshold" => "10" }
end

AuditLog.find_or_create_by!(user: ops, action: "refund_approved") do |al|
  al.auditable_type = "Refund"
  al.auditable_id = refund1.id
  al.change_details = { "status" => ["pending", "approved"] }
end

RevenueAnomaly.find_or_create_by!(event: event2, order: order3, user: organizer1) do |ra|
  ra.anomaly_type = "high_refund"
  ra.amount = 560.00
  ra.description = "退票率偏高：30%"
  ra.status = "open"
  ra.detected_at = 4.days.ago
end

puts "种子数据加载完成！"
puts "管理员: admin@ticket.com / admin123"
puts "运营:   ops@ticket.com / ops12345"
puts "主办方: org1@example.com / org12345"
