
puts '开始创建种子数据...'

unless User.exists?(email: 'admin@museum.com')
  admin = User.create!(
    name: '系统管理员',
    email: 'admin@museum.com',
    password: 'password123',
    password_confirmation: 'password123',
    role: :admin,
    status: :active,
    phone: '13800138000'
  )
  puts "创建管理员: #{admin.name}"
end

unless User.exists?(email: 'teacher@museum.com')
  teacher = User.create!(
    name: '王老师',
    email: 'teacher@museum.com',
    password: 'password123',
    password_confirmation: 'password123',
    role: :teacher,
    status: :active,
    phone: '13800138001'
  )
  puts "创建老师: #{teacher.name}"
end

unless User.exists?(email: 'guide1@museum.com')
  guide1 = User.create!(
    name: '张讲解员',
    email: 'guide1@museum.com',
    password: 'password123',
    password_confirmation: 'password123',
    role: :guide,
    status: :active,
    phone: '13800138002'
  )
  puts "创建讲解员: #{guide1.name}"
end

unless User.exists?(email: 'guide2@museum.com')
  guide2 = User.create!(
    name: '李讲解员',
    email: 'guide2@museum.com',
    password: 'password123',
    password_confirmation: 'password123',
    role: :guide,
    status: :active,
    phone: '13800138003'
  )
  puts "创建讲解员: #{guide2.name}"
end

unless User.exists?(email: 'parent@school.com')
  parent = User.create!(
    name: '家长代表',
    email: 'parent@school.com',
    password: 'password123',
    password_confirmation: 'password123',
    role: :external,
    status: :active,
    phone: '13900139000'
  )
  puts "创建外部用户: #{parent.name}"
end

unless School.exists?(name: '第一实验小学')
  school1 = School.create!(
    name: '第一实验小学',
    contact_person: '刘校长',
    phone: '010-12345678',
    email: 'contact@school1.com',
    address: '北京市朝阳区教育路1号',
    status: :active
  )
  puts "创建学校: #{school1.name}"

  student_names = ['小明', '小红', '小刚', '小丽', '小强', '小芳', '小军', '小燕', '小华', '小磊']
  student_names.each_with_index do |name, i|
    Student.create!(
      school: school1,
      name: name,
      gender: i.even? ? :male : :female,
      age_group: [:primary_1_2, :primary_3_4, :primary_5_6].sample,
      status: :active
    )
  end
  puts "  - 创建 #{student_names.count} 名学生"
end

unless School.exists?(name: '第二中学')
  school2 = School.create!(
    name: '第二中学',
    contact_person: '陈主任',
    phone: '010-87654321',
    email: 'contact@school2.com',
    address: '北京市海淀区学院路2号',
    status: :active
  )
  puts "创建学校: #{school2.name}"

  15.times do |i|
    Student.create!(
      school: school2,
      name: "学生#{i + 1}",
      gender: i.even? ? :male : :female,
      age_group: [:junior_high, :senior_high].sample,
      status: :active
    )
  end
  puts "  - 创建 15 名学生"
end

unless Course.exists?(title: '古代青铜器探索')
  course1 = Course.create!(
    title: '古代青铜器探索',
    description: '探索中国古代青铜器的历史和工艺，了解商周时期的青铜文明。适合小学高年级学生。',
    age_min: 9,
    age_max: 12,
    duration_minutes: 90,
    capacity: 30,
    status: :published,
    category: '历史文化'
  )
  puts "创建课程: #{course1.title}"
end

unless Course.exists?(title: '恐龙化石探秘')
  course2 = Course.create!(
    title: '恐龙化石探秘',
    description: '走进古生物世界，认识不同时期的恐龙，亲手触摸化石模型。适合小学低年级学生。',
    age_min: 6,
    age_max: 9,
    duration_minutes: 60,
    capacity: 25,
    status: :published,
    category: '自然科学'
  )
  puts "创建课程: #{course2.title}"
end

unless Course.exists?(title: '书画艺术鉴赏')
  course3 = Course.create!(
    title: '书画艺术鉴赏',
    description: '欣赏中国传统书画艺术，了解笔墨纸砚，体验简单的书法创作。适合中学生。',
    age_min: 12,
    age_max: 18,
    duration_minutes: 120,
    capacity: 20,
    status: :published,
    category: '艺术审美'
  )
  puts "创建课程: #{course3.title}"
end

if Session.count < 5
  course1 = Course.find_by(title: '古代青铜器探索')
  course2 = Course.find_by(title: '恐龙化石探秘')
  course3 = Course.find_by(title: '书画艺术鉴赏')
  guide1 = User.find_by(email: 'guide1@museum.com')
  guide2 = User.find_by(email: 'guide2@museum.com')

  sessions = [
    { course: course1, start_at: 3.days.from_now.change(hour: 9, min: 0), end_at: 3.days.from_now.change(hour: 10, min: 30), location: '青铜器展厅A区', capacity: 30 },
    { course: course1, start_at: 5.days.from_now.change(hour: 14, min: 0), end_at: 5.days.from_now.change(hour: 15, min: 30), location: '青铜器展厅A区', capacity: 30 },
    { course: course2, start_at: 2.days.from_now.change(hour: 10, min: 0), end_at: 2.days.from_now.change(hour: 11, min: 0), location: '古生物展厅', capacity: 25 },
    { course: course2, start_at: 4.days.from_now.change(hour: 9, min: 30), end_at: 4.days.from_now.change(hour: 10, min: 30), location: '古生物展厅', capacity: 25 },
    { course: course3, start_at: 6.days.from_now.change(hour: 14, min: 0), end_at: 6.days.from_now.change(hour: 16, min: 0), location: '书画展厅', capacity: 20 }
  ]

  sessions.each do |s|
    session = Session.create!(
      course: s[:course],
      start_at: s[:start_at],
      end_at: s[:end_at],
      location: s[:location],
      capacity: s[:capacity],
      status: :open,
      registered_count: 0
    )
    puts "创建场次: #{session.course.title} - #{session.start_at.strftime('%m-%d %H:%M')}"

    if session.start_at == sessions.first[:start_at]
      session.assign_guide(guide1, 'main')
      puts "  - 安排讲解员: #{guide1.name}"
    elsif session.start_at == sessions.last[:start_at]
      session.assign_guide(guide2, 'main')
      puts "  - 安排讲解员: #{guide2.name}"
    end
  end
end

unless Equipment.exists?(name: 'AR眼镜')
  Equipment.create!(
    name: 'AR眼镜',
    category: '互动设备',
    quantity: 20,
    status: :available,
    description: '增强现实眼镜，用于沉浸式体验'
  )
  Equipment.create!(
    name: '讲解器',
    category: '音频设备',
    quantity: 50,
    status: :available,
    description: '无线讲解接收设备'
  )
  Equipment.create!(
    name: '实验工具箱',
    category: '教学用具',
    quantity: 15,
    status: :available,
    description: '包含放大镜、镊子等工具'
  )
  puts "创建 3 种教具"
end

puts '种子数据创建完成！'
puts ''
puts '默认账号：'
puts '  管理员: admin@museum.com / password123'
puts '  老师: teacher@museum.com / password123'
puts '  讲解员: guide1@museum.com / password123'
puts '  讲解员: guide2@museum.com / password123'
puts '  外部用户: parent@school.com / password123'
