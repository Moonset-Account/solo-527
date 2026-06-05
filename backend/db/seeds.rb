ActiveRecord::Base.transaction do
  puts '开始创建种子数据...'

  categories = [
    { name: '陶艺', code: 'pottery', sort_order: 1, icon_url: '🏺', description: '拉坯、捏塑、上釉等陶艺课程' },
    { name: '银饰', code: 'silver', sort_order: 2, icon_url: '💍', description: '银饰制作、锻造、镶嵌等金工课程' },
    { name: '皮具', code: 'leather', sort_order: 3, icon_url: '👜', description: '皮雕、皮具制作、手缝等皮具课程' }
  ]

  categories.each do |cat|
    CourseCategory.create_with(description: cat[:description], icon_url: cat[:icon_url], sort_order: cat[:sort_order], is_active: true)
      .find_or_create_by!(code: cat[:code], name: cat[:name])
  end

  puts '课程分类创建完成'

  admin = User.create_with(
    name: '系统管理员',
    password: 'admin123',
    role: :super_admin,
    email: 'admin@example.com'
  ).find_or_create_by!(phone: '13800138000')
  puts "管理员账号创建完成: #{admin.phone}"

  teacher1_user = User.create_with(
    name: '李陶艺',
    password: '123456',
    role: :teacher,
    email: 'teacher1@example.com'
  ).find_or_create_by!(phone: '13800138002')

  teacher1 = teacher1_user.teacher || teacher1_user.create_teacher!(
    status: :active,
    hourly_rate: 200,
    specialties: ['陶艺', '雕塑'],
    bio: '10年陶艺教学经验，作品多次获得国家级奖项',
    hire_date: '2020-01-15'
  )
  puts "老师1创建完成: #{teacher1.user.phone}"

  teacher2_user = User.create_with(
    name: '王银匠',
    password: '123456',
    role: :teacher,
    email: 'teacher2@example.com'
  ).find_or_create_by!(phone: '13800138003')

  teacher2 = teacher2_user.teacher || teacher2_user.create_teacher!(
    status: :active,
    hourly_rate: 250,
    specialties: ['银饰', '金工'],
    bio: '资深银饰匠人，传统金工技艺传承人',
    hire_date: '2019-06-20'
  )
  puts "老师2创建完成: #{teacher2.user.phone}"

  teacher3_user = User.create_with(
    name: '张皮匠',
    password: '123456',
    role: :teacher,
    email: 'teacher3@example.com'
  ).find_or_create_by!(phone: '13800138004')

  teacher3 = teacher3_user.teacher || teacher3_user.create_teacher!(
    status: :active,
    hourly_rate: 180,
    specialties: ['皮具', '皮雕'],
    bio: '意大利手工皮具学习经历，专注传统皮雕技艺',
    hire_date: '2021-03-10'
  )
  puts "老师3创建完成: #{teacher3.user.phone}"

  5.times do |i|
    user = User.create_with(
      name: "学员#{i + 1}",
      password: '123456',
      role: :student,
      email: "student#{i + 1}@example.com"
    ).find_or_create_by!(phone: "1380013801#{i}")

    student = user.student || user.create_student!(
      level: %i[beginner intermediate advanced].sample,
      total_courses: rand(0..10),
      total_spent: rand(0..5000)
    )
    puts "学员#{i + 1}创建完成: #{user.phone}"
  end

  student_user = User.find_by(phone: '13800138001')
  unless student_user
    student_user = User.create!(
      phone: '13800138001',
      name: '张小手',
      password: '123456',
      role: :student,
      email: 'student0@example.com'
    )
    student_user.create_student!(level: :beginner)
  end
  puts "测试学员账号: #{student_user.phone}"

  materials = [
    { name: '陶艺基础材料包', sku: 'POT-001', cost_price: 50, sale_price: 80, stock_quantity: 50, safety_stock: 10 },
    { name: '陶艺进阶材料包', sku: 'POT-002', cost_price: 80, sale_price: 120, stock_quantity: 30, safety_stock: 5 },
    { name: '银饰基础材料包', sku: 'SIL-001', cost_price: 150, sale_price: 200, stock_quantity: 25, safety_stock: 5 },
    { name: '银饰进阶材料包', sku: 'SIL-002', cost_price: 300, sale_price: 400, stock_quantity: 15, safety_stock: 3 },
    { name: '皮具基础材料包', sku: 'LEA-001', cost_price: 100, sale_price: 150, stock_quantity: 40, safety_stock: 8 },
    { name: '皮具进阶材料包', sku: 'LEA-002', cost_price: 200, sale_price: 280, stock_quantity: 20, safety_stock: 5 }
  ]

  materials.each do |mat|
    MaterialPackage.create_with(
      description: "#{mat[:name]}，包含所有所需材料",
      image_url: nil,
      status: :active
    ).find_or_create_by!(sku: mat[:sku]) do |m|
      m.name = mat[:name]
      m.cost_price = mat[:cost_price]
      m.sale_price = mat[:sale_price]
      m.stock_quantity = mat[:stock_quantity]
      m.safety_stock = mat[:safety_stock]
    end
  end
  puts '材料包创建完成'

  pottery_cat = CourseCategory.find_by(code: 'pottery')
  silver_cat = CourseCategory.find_by(code: 'silver')
  leather_cat = CourseCategory.find_by(code: 'leather')

  courses = [
    {
      category: pottery_cat,
      title: '陶艺入门 - 手捏杯',
      description: '零基础也能轻松上手，亲手制作属于自己的陶艺杯子',
      content: '课程内容：陶艺基础知识讲解、揉泥练习、手捏成型、修坯、上釉',
      duration_minutes: 120,
      price: 299,
      material_fee: 80,
      difficulty_level: 1,
      min_students: 1,
      max_students: 6
    },
    {
      category: pottery_cat,
      title: '拉坯进阶 - 茶碗制作',
      description: '学习拉坯技巧，制作精致茶碗',
      content: '课程内容：拉坯基础技巧、定中心、开孔、拔高、修形',
      duration_minutes: 180,
      price: 399,
      material_fee: 120,
      difficulty_level: 2,
      min_students: 1,
      max_students: 4
    },
    {
      category: silver_cat,
      title: '银饰入门 - 戒指制作',
      description: '亲手打造一枚独一无二的银戒指',
      content: '课程内容：银饰基础知识、锯切、锉修、焊接、打磨、抛光',
      duration_minutes: 150,
      price: 499,
      material_fee: 200,
      difficulty_level: 1,
      min_students: 1,
      max_students: 6
    },
    {
      category: silver_cat,
      title: '银饰进阶 - 吊坠镶嵌',
      description: '学习宝石镶嵌工艺，制作精美吊坠',
      content: '课程内容：包镶、爪镶技法、宝石镶嵌、抛光',
      duration_minutes: 240,
      price: 699,
      material_fee: 400,
      difficulty_level: 3,
      min_students: 1,
      max_students: 4
    },
    {
      category: leather_cat,
      title: '皮具入门 - 短夹钱包',
      description: '从零开始学习手缝皮具，制作短款钱包',
      content: '课程内容：皮具工具使用、裁皮、打孔、手缝、封边',
      duration_minutes: 180,
      price: 359,
      material_fee: 150,
      difficulty_level: 1,
      min_students: 1,
      max_students: 6
    },
    {
      category: leather_cat,
      title: '皮雕入门 - 图腾卡包',
      description: '学习传统皮雕技法，制作雕刻卡包',
      content: '课程内容：皮雕基础、旋转刻刀使用、印花工具、染色',
      duration_minutes: 240,
      price: 459,
      material_fee: 200,
      difficulty_level: 2,
      min_students: 1,
      max_students: 4
    }
  ]

  courses.each do |c|
    Course.create_with(
      description: c[:description],
      content: c[:content],
      cover_url: nil,
      gallery_urls: [],
      duration_minutes: c[:duration_minutes],
      price: c[:price],
      material_fee: c[:material_fee],
      difficulty_level: c[:difficulty_level],
      min_students: c[:min_students],
      max_students: c[:max_students],
      requires_approval: false,
      is_published: true,
      tags: []
    ).find_or_create_by!(course_category: c[:category], title: c[:title])
  end
  puts '课程创建完成'

  Course.all.each_with_index do |course, i|
    next if i > 4
    teacher = case course.course_category.code
              when 'pottery' then teacher1
              when 'silver' then teacher2
              when 'leather' then teacher3
              else teacher1
              end

    material = MaterialPackage.find_by('sku LIKE ?', "#{course.course_category.code.upcase}%")

    3.times do |j|
      start_time = (Date.today + i + j).to_time.change(hour: [10, 14, 19].sample, min: 0)
      CourseSession.create_with(
        teacher: teacher,
        material_package: material,
        end_time: start_time + course.duration_minutes.minutes,
        location: ["工作室A", "工作室B", "工作室C"].sample,
        status: :scheduled,
        registered_count: rand(0..course.max_students)
      ).find_or_create_by!(
        course: course,
        start_time: start_time
      )
    end
  end
  puts '课程安排创建完成'

  puts '✅ 种子数据创建完成！'
  puts ''
  puts '测试账号：'
  puts '  管理员：13800138000 / admin123'
  puts '  学员：13800138001 / 123456'
  puts '  老师1：13800138002 / 123456'
  puts '  老师2：13800138003 / 123456'
  puts '  老师3：13800138004 / 123456'
end
