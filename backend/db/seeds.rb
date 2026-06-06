require 'faker'

puts 'Creating seeds...'

User.create!(
  name: '超级管理员',
  email: 'admin@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'super_admin',
  phone: '13800000000',
  confirmed_at: Time.current
)

admin = User.create!(
  name: '工作室管理员',
  email: 'manager@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'admin',
  phone: '13800000001',
  confirmed_at: Time.current
)

teacher_user1 = User.create!(
  name: '李老师',
  email: 'teacher1@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'teacher',
  phone: '13800000002',
  confirmed_at: Time.current
)

teacher1 = Teacher.create!(
  user: teacher_user1,
  name: '李老师',
  bio: '10年陶艺经验，擅长手工拉坯和釉料配制',
  specialty: %w[pottery],
  hourly_rate: 200,
  status: 'active'
)

teacher_user2 = User.create!(
  name: '王老师',
  email: 'teacher2@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'teacher',
  phone: '13800000003',
  confirmed_at: Time.current
)

teacher2 = Teacher.create!(
  user: teacher_user2,
  name: '王老师',
  bio: '8年银饰制作经验，擅长花丝镶嵌工艺',
  specialty: %w[silver],
  hourly_rate: 250,
  status: 'active'
)

teacher_user3 = User.create!(
  name: '张老师',
  email: 'teacher3@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  role: 'teacher',
  phone: '13800000004',
  confirmed_at: Time.current
)

teacher3 = Teacher.create!(
  user: teacher_user3,
  name: '张老师',
  bio: '12年皮具制作经验，擅长手工缝制和皮雕',
  specialty: %w[leather],
  hourly_rate: 220,
  status: 'active'
)

5.times do |i|
  User.create!(
    name: "学员#{i + 1}",
    email: "student#{i + 1}@example.com",
    password: 'password123',
    password_confirmation: 'password123',
    role: 'student',
    phone: "1390000000#{i}",
    confirmed_at: Time.current
  )
end

material1 = MaterialKit.create!(
  name: '陶艺基础材料包',
  description: '包含陶泥500g、釉料3色、基础工具套装',
  stock: 50,
  warning_threshold: 10,
  unit_price: 80,
  status: 'in_stock'
)

material2 = MaterialKit.create!(
  name: '银饰基础材料包',
  description: '包含925银片20g、焊药、砂纸套装',
  stock: 30,
  warning_threshold: 5,
  unit_price: 150,
  status: 'in_stock'
)

material3 = MaterialKit.create!(
  name: '皮具基础材料包',
  description: '包含头层牛皮2尺、蜡线、菱斩、针',
  stock: 25,
  warning_threshold: 5,
  unit_price: 120,
  status: 'in_stock'
)

material4 = MaterialKit.create!(
  name: '陶艺进阶材料包',
  description: '包含陶泥1kg、特种釉料、雕刻工具',
  stock: 0,
  warning_threshold: 5,
  unit_price: 180,
  status: 'out_of_stock'
)

categories = {
  pottery: { name: '陶艺', teacher: teacher1, material: material1, price: 299, duration: 180 },
  silver: { name: '银饰', teacher: teacher2, material: material2, price: 399, duration: 240 },
  leather: { name: '皮具', teacher: teacher3, material: material3, price: 349, duration: 210 }
}

course_titles = {
  pottery: ['手工拉坯入门', '陶艺雕塑基础', '釉色创意设计', '陶艺茶器制作'],
  silver: ['银饰戒指制作', '银项链锻造', '花丝镶嵌入门', '复古银饰工艺'],
  leather: ['短款钱包制作', '卡包手工缝制', '皮雕基础技法', '手账本皮套']
}

categories.each do |category, info|
  course_titles[category].each_with_index do |title, i|
    course = Course.create!(
      title: title,
      description: "#{info[:name]}精品课程，由专业老师手把手教学，零基础可学。课程包含#{info[:material].name}，完成后可带走自己的作品。",
      category: category,
      duration: info[:duration],
      price: info[:price],
      max_students: 8,
      teacher: info[:teacher],
      material_kit: info[:material],
      status: i < 3 ? 'published' : 'draft'
    )

    next unless course.published?

    4.times do |j|
      start_time = (Date.today + j.days + 7).to_datetime + 14.hours
      Schedule.create!(
        course: course,
        start_time: start_time,
        end_time: start_time + (info[:duration] / 60).hours,
        location: "#{info[:name]}工坊#{(j % 3) + 1}号桌",
        max_students: 8
      )
    end
  end
end

students = User.where(role: 'student').to_a
courses = Course.published.includes(:schedules).to_a

students.each_with_index do |student, i|
  course = courses[i % courses.size]
  schedule = course.schedules.first

  enrollment = Enrollment.create!(
    course: course,
    schedule: schedule,
    student: student,
    material_kit: course.material_kit,
    total_amount: course.price + course.material_kit.unit_price,
    status: i < 3 ? 'paid' : 'pending',
    payment_method: i < 3 ? 'online' : nil,
    paid_at: i < 3 ? Time.current : nil,
    amount_paid: i < 3 ? course.price + course.material_kit.unit_price : 0
  )

  next unless enrollment.paid?

  Work.create!(
    title: "#{student.name}的#{course.title}作品",
    description: "这是我第一次上#{course.category == 'pottery' ? '陶艺' : course.category == 'silver' ? '银饰' : '皮具'}课，很有成就感！",
    images: ["https://picsum.photos/seed/work#{i}1/400/500", "https://picsum.photos/seed/work#{i}2/400/500"],
    student: student,
    course: course,
    enrollment: enrollment,
    is_public: i < 2,
    authorized_at: i < 2 ? Time.current : nil,
    authorized_by: i < 2 ? student : nil,
    authorized_by_student: i < 2,
    review_status: i < 2 ? 'approved' : 'pending',
    approved_at: i < 2 ? Time.current : nil,
    approved_by: i < 2 ? admin : nil
  )

  if i == 0
    Review.create!(
      enrollment: enrollment,
      course: course,
      student: student,
      teacher: course.teacher,
      rating: 5,
      content: '老师非常耐心，课程内容很丰富，推荐大家来体验！',
      images: ["https://picsum.photos/seed/review#{i}/400/300"]
    )
  end
end

puts 'Seeds created successfully!'
puts "Admin: admin@example.com / password123"
puts "Manager: manager@example.com / password123"
