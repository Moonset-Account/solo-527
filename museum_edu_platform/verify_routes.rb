
puts "=" * 60
puts "路由和功能验证"
puts "=" * 60

routes = Rails.application.routes.url_helpers

puts "\n1. 核心路由验证"
puts "-" * 40
puts "首页: #{routes.root_path}"
puts "课程列表: #{routes.courses_path}"
puts "登录: #{routes.new_user_session_path}"
puts "管理员仪表盘: #{routes.admin_dashboard_path}"
puts "管理员报名列表: #{routes.admin_registrations_path}"
puts "移动端签到: #{routes.mobile_check_in_path('test_token')}"
puts "移动端同步: #{routes.mobile_check_ins_sync_path}"

puts "\n2. 数据验证"
puts "-" * 40
puts "用户数: #{User.count}"
puts "课程数: #{Course.count}"
puts "场次: #{Session.count}"
puts "报名: #{Registration.count}"
puts "学生: #{Student.count}"

puts "\n3. 散客报名验证"
puts "-" * 40
session = Session.first
reg = Registration.new(
  session: session,
  registration_type: 'individual',
  student_count: 2,
  contact_name: '测试家长',
  contact_phone: '13800138000',
  contact_email: 'test@example.com'
)
puts "散客报名(无school_id)验证: #{reg.valid? ? '✅ 通过' : '❌ 失败: ' + reg.errors.full_messages.join(', ')}"

puts "\n4. 团体报名验证"
puts "-" * 40
reg2 = Registration.new(
  session: session,
  registration_type: 'school_group',
  school: School.first,
  student_count: 10,
  contact_name: '王老师',
  contact_phone: '13900139000',
  contact_email: 'teacher@school.com'
)
puts "团体报名验证: #{reg2.valid? ? '✅ 通过' : '❌ 失败: ' + reg2.errors.full_messages.join(', ')}"

puts "\n5. 移动端签到(无checked_in_by)验证"
puts "-" * 40
student = Student.first
check_in = CheckIn.new(
  registration: session.registrations.first || Registration.first,
  student: student,
  session: session,
  checked_in_at: Time.current,
  check_in_method: 'qr',
  status: 'confirmed'
)
puts "无checked_in_by签到验证: #{check_in.valid? ? '✅ 通过' : '❌ 失败: ' + check_in.errors.full_messages.join(', ')}"

puts "\n6. Session QR Token 验证"
puts "-" * 40
session = Session.first
puts "场次 #{session.id} QR Token: #{session.qr_code_token[0..20]}..."
puts "场次二维码URL: #{session.qr_code_data[0..50]}..."

puts "\n" + "=" * 60
puts "验证完成！"
puts "=" * 60
