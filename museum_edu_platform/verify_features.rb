
puts "=" * 60
puts "博物馆研学活动报名平台 - 核心功能验证"
puts "=" * 60

puts "\n1. 验证多角色用户系统"
puts "-" * 40
users = User.all
users.each do |u|
  puts "  #{u.name} - #{u.role} - #{u.email}"
end

puts "\n2. 验证课程和场次数据"
puts "-" * 40
courses = Course.all
courses.each do |c|
  puts "  课程: #{c.title} (#{c.age_range}, 容量#{c.capacity}人)"
  c.sessions.each do |s|
    puts "    场次: #{s.start_at.strftime('%m-%d %H:%M')} - #{s.status} - 剩余名额: #{s.available_spots}"
  end
end

puts "\n3. 验证讲解员排班冲突检测"
puts "-" * 40
guide = User.find_by(email: 'guide1@museum.com')
session1 = Session.first
session2 = Session.where.not(id: session1.id).first
puts "  讲解员: #{guide.name}"
puts "  已安排场次: #{session1.course.title} #{session1.start_at.strftime('%m-%d %H:%M')}"
puts "  在已安排场次时间段是否可用(排除自身): #{guide.available_for_session?(session1.start_at, session1.end_at, session1.id)}"
puts "  在第二场次时间段是否可用: #{guide.available_for_session?(session2.start_at, session2.end_at)}"

puts "\n4. 验证儿童信息最小化采集"
puts "-" * 40
student = Student.first
puts "  学生字段: #{Student.column_names.reject { |c| ['id', 'school_id', 'created_at', 'updated_at'].include?(c) }.join(', ')}"
puts "  示例学生: #{student.name} - #{student.gender} - #{student.age_group}"
puts "  (无身份证、家庭住址、家长手机号等敏感信息)"

puts "\n5. 验证名额控制和报名工作流"
puts "-" * 40
session = Session.first
puts "  场次: #{session.course.title} #{session.start_at.strftime('%m-%d %H:%M')}"
puts "  总容量: #{session.capacity}"
puts "  已报名: #{session.approved_registrations_count}"
puts "  剩余名额: #{session.available_spots}"
puts "  是否可报名: #{session.can_register?}"

puts "\n6. 验证审计记录"
puts "-" * 40
course = Course.first
puts "  课程 '#{course.title}' 的版本记录数: #{course.versions.count}"
if course.versions.any?
  puts "  最新版本事件: #{course.versions.last.event}"
end

puts "\n7. 验证学校和学生数据"
puts "-" * 40
schools = School.all
schools.each do |s|
  puts "  学校: #{s.name} - 学生数: #{s.students.count}"
end

puts "\n8. 验证二维码生成"
puts "-" * 40
session = Session.first
puts "  场次QR Token: #{session.qr_token[0..15]}..." if session.qr_token
puts "  二维码数据: #{session.qr_code_data[0..30]}..."

puts "\n" + "=" * 60
puts "核心功能验证完成！"
puts "=" * 60
