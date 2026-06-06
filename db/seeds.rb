# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the bin/rails db:seed command (or created alongside the database with db:setup).

puts 'Seeding database...'

# Create users
admin = User.find_or_create_by!(email: 'admin@museum.com') do |u|
  u.name = '系统管理员'
  u.password = 'password123'
  u.role = :admin
  u.status = :active
  u.phone = '13800000001'
end

education_teacher = User.find_or_create_by!(email: 'teacher@museum.com') do |u|
  u.name = '李老师'
  u.password = 'password123'
  u.role = :education_teacher
  u.status = :active
  u.phone = '13800000002'
end

# Create schools
school1 = School.find_or_create_by!(name: '北京市第一实验小学') do |s|
  s.contact_person = '王校长'
  s.phone = '13800000010'
  s.email = 'contact@school1.com'
  s.address = '北京市东城区1号'
  s.status = :active
end

school2 = School.find_or_create_by!(name: '北京市第二中学') do |s|
  s.contact_person = '刘主任'
  s.phone = '13800000011'
  s.email = 'contact@school2.com'
  s.address = '北京市西城区2号'
  s.status = :active
end

# Create courses
course1 = Course.find_or_create_by!(title: '青铜时代的秘密') do |c|
  c.description = '探索中国古代青铜文明，了解青铜器的制作工艺和历史价值'
  c.age_min = 8
  c.age_max = 14
  c.duration_minutes = 120
  c.max_participants = 30
  c.status = :published
  c.created_by = admin
end

course2 = Course.find_or_create_by!(title: '小小考古学家') do |c|
  c.description = '模拟考古发掘现场，学习考古学基本知识'
  c.age_min = 6
  c.age_max = 12
  c.duration_minutes = 90
  c.max_participants = 20
  c.status = :published
  c.created_by = education_teacher
end

course3 = Course.find_or_create_by!(title: '中国书画入门') do |c|
  c.description = '了解中国传统书画艺术，体验毛笔书法'
  c.age_min = 10
  c.age_max = 18
  c.duration_minutes = 150
  c.max_participants = 25
  c.status = :published
  c.created_by = education_teacher
end

# Create course sessions
session1 = CourseSession.find_or_create_by!(
  course: course1,
  start_time: 1.week.from_now.change(hour: 9, min: 0, sec: 0)
) do |s|
  s.end_time = 1.week.from_now.change(hour: 11, min: 0, sec: 0)
  s.location = '青铜展厅A区'
  s.max_participants = 30
  s.status = :scheduled
end

session2 = CourseSession.find_or_create_by!(
  course: course1,
  start_time: 1.week.from_now.change(hour: 14, min: 0, sec: 0)
) do |s|
  s.end_time = 1.week.from_now.change(hour: 16, min: 0, sec: 0)
  s.location = '青铜展厅A区'
  s.max_participants = 30
  s.status = :scheduled
end

session3 = CourseSession.find_or_create_by!(
  course: course2,
  start_time: 2.weeks.from_now.change(hour: 10, min: 0, sec: 0)
) do |s|
  s.end_time = 2.weeks.from_now.change(hour: 11, min: 30, sec: 0)
  s.location = '考古体验区'
  s.max_participants = 20
  s.status = :scheduled
end

# Create guides
guide1 = Guide.find_or_create_by!(employee_id: 'G001') do |g|
  g.name = '张讲解员'
  g.phone = '13800000020'
  g.email = 'zhang@museum.com'
  g.specialties = '青铜器、商周历史'
  g.status = :active
end

guide2 = Guide.find_or_create_by!(employee_id: 'G002') do |g|
  g.name = '李讲解员'
  g.phone = '13800000021'
  g.email = 'li@museum.com'
  g.specialties = '考古学、田野发掘'
  g.status = :active
end

guide3 = Guide.find_or_create_by!(employee_id: 'G003') do |g|
  g.name = '王讲解员'
  g.phone = '13800000022'
  g.email = 'wang@museum.com'
  g.specialties = '书画艺术、传统美学'
  g.status = :active
end

# Assign guides to sessions
GuideAssignment.find_or_create_by!(guide: guide1, course_session: session1) do |a|
  a.role = '主讲'
  a.status = :assigned
end

GuideAssignment.find_or_create_by!(guide: guide2, course_session: session2) do |a|
  a.role = '主讲'
  a.status = :assigned
end

GuideAssignment.find_or_create_by!(guide: guide2, course_session: session3) do |a|
  a.role = '主讲'
  a.status = :assigned
end

# Create students
student1 = Student.find_or_create_by!(name: '小明', age: 10, school: school1) do |s|
  s.grade = '四年级'
  s.emergency_contact_name = '小明爸爸'
  s.emergency_contact_phone = '13900000001'
  s.health_notes = '无'
end

student2 = Student.find_or_create_by!(name: '小红', age: 9, school: school1) do |s|
  s.grade = '三年级'
  s.emergency_contact_name = '小红妈妈'
  s.emergency_contact_phone = '13900000002'
  s.health_notes = '青霉素过敏'
end

student3 = Student.find_or_create_by!(name: '小刚', age: 12, school: school2) do |s|
  s.grade = '初一'
  s.emergency_contact_name = '小刚爸爸'
  s.emergency_contact_phone = '13900000003'
  s.health_notes = '无'
end

# Create bookings
booking1 = Booking.find_or_create_by!(
  course_session: session1,
  school: school1
) do |b|
  b.booking_type = :school_group
  b.contact_name = '王老师'
  b.contact_phone = '13800000030'
  b.contact_email = 'wanglaoshi@school1.com'
  b.student_count = 25
  b.teacher_count = 3
  b.special_requirements = '需要安排无障碍通道'
  b.status = :confirmed
  b.created_by = education_teacher
end

booking2 = Booking.find_or_create_by!(
  course_session: session2,
  school: school2
) do |b|
  b.booking_type = :school_group
  b.contact_name = '刘老师'
  b.contact_phone = '13800000031'
  b.contact_email = 'liulaoshi@school2.com'
  b.student_count = 20
  b.teacher_count = 2
  b.status = :pending
  b.created_by = education_teacher
end

# Add students to bookings
[student1, student2].each do |student|
  booking1.booking_students.find_or_create_by!(student: student)
end

# Create teaching aids
aid1 = TeachingAid.find_or_create_by!(name: '青铜器模型套装') do |a|
  a.category = '文物模型'
  a.total_quantity = 10
  a.available_quantity = 10
  a.description = '包含5件代表性青铜器模型'
  a.location = '教具室A柜'
end

aid2 = TeachingAid.find_or_create_by!(name: '考古工具套装') do |a|
  a.category = '体验工具'
  a.total_quantity = 20
  a.available_quantity = 20
  a.description = '小手铲、刷子、放大镜等'
  a.location = '教具室B柜'
end

aid3 = TeachingAid.find_or_create_by!(name: '文房四宝套装') do |a|
  a.category = '书画工具'
  a.total_quantity = 15
  a.available_quantity = 15
  a.description = '笔墨纸砚基础套装'
  a.location = '教具室C柜'
end

# Create sample feedback
Feedback.find_or_create_by!(
  course_session: session1,
  booking: booking1,
  author: education_teacher
) do |f|
  f.rating = 5
  f.content = '讲解非常生动，学生们都很感兴趣，希望下次还能参加！'
  f.improvement_suggestions = '希望能增加更多互动环节'
  f.would_recommend = true
end

puts 'Database seeded successfully!'
puts "Admin user: admin@museum.com / password123"
puts "Teacher user: teacher@museum.com / password123"
