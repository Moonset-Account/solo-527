admin = User.find_or_create_by!(email: "admin@swim.com") do |u|
  u.name = "系统管理员"
  u.password = "password123"
  u.role = "admin"
  u.phone = "13800000001"
end

supervisor = User.find_or_create_by!(email: "supervisor@swim.com") do |u|
  u.name = "李主管"
  u.password = "password123"
  u.role = "supervisor"
  u.phone = "13800000002"
end

coaches = %w[张教练 王教练 刘教练 陈教练].each_with_index.map do |name, i|
  User.find_or_create_by!(email: "coach#{i + 1}@swim.com") do |u|
    u.name = name
    u.password = "password123"
    u.role = "member"
    u.phone = "1380000010#{i + 1}"
  end
end

members = 20.times.map do |i|
  User.find_or_create_by!(email: "member#{i + 1}@example.com") do |u|
    u.name = Faker::Name.first_name + ["明", "华", "强", "丽", "芳", "伟", "敏", "杰", "静", "磊",
                                        "洋", "军", "英", "勇", "艳", "刚", "娟", "涛", "秀", "平"][i]
    u.password = "password123"
    u.role = "member"
    u.phone = "1390000100#{i + 1}"
  end
end

pool_a = Venue.find_or_create_by!(name: "奥林匹克标准池") do |v|
  v.location = "A栋1层"
  v.capacity = 50
  v.facilities = "50米标准泳池, 观众席, 更衣室, 淋浴间"
  v.status = "active"
  v.description = "50米×25米国际标准游泳池，8条泳道，水深1.8-2.2米"
end

pool_b = Venue.find_or_create_by!(name: "训练短池") do |v|
  v.location = "A栋2层"
  v.capacity = 30
  v.facilities = "25米训练泳池, 教学区, 更衣室"
  v.status = "active"
  v.description = "25米×15米训练泳池，6条泳道，水深1.2-1.8米，适合初学者"
end

pool_c = Venue.find_or_create_by!(name: "儿童戏水池") do |v|
  v.location = "B栋1层"
  v.capacity = 20
  v.facilities = "儿童泳池, 游戏区, 家长休息区"
  v.status = "active"
  v.description = "浅水区0.6-0.9米，配备水温调节系统，适合3-12岁儿童"
end

pool_d = Venue.find_or_create_by!(name: "跳水池") do |v|
  v.location = "A栋1层东侧"
  v.capacity = 15
  v.facilities = "3米跳板, 5米跳台, 10米跳台"
  v.status = "active"
  v.description = "标准跳水设施，深度5米，配备气泡系统"
end

[
  { name: "自由泳入门", level: "初级", coach: "张教练", capacity: 15, price: 1200, venue: pool_b,
    start: 1.week.from_now, fin: 12.weeks.from_now, schedule: "每周二、四 10:00-11:30" },
  { name: "蛙泳提高班", level: "中级", coach: "王教练", capacity: 12, price: 1500, venue: pool_b,
    start: 1.week.from_now, fin: 8.weeks.from_now, schedule: "每周一、三、五 14:00-15:30" },
  { name: "蝶泳进阶班", level: "高级", coach: "刘教练", capacity: 8, price: 2000, venue: pool_a,
    start: 2.weeks.from_now, fin: 10.weeks.from_now, schedule: "每周六 09:00-11:00" },
  { name: "少儿游泳启蒙", level: "初级", coach: "陈教练", capacity: 10, price: 980, venue: pool_c,
    start: 1.week.from_now, fin: 12.weeks.from_now, schedule: "每周六、日 10:00-11:00" },
  { name: "成人健身游泳", level: "中级", coach: "张教练", capacity: 20, price: 800, venue: pool_a,
    start: 3.days.from_now, fin: 4.weeks.from_now, schedule: "每周一至五 06:00-07:30" },
  { name: "仰泳技术班", level: "中级", coach: "王教练", capacity: 12, price: 1500, venue: pool_a,
    start: 2.weeks.from_now, fin: 8.weeks.from_now, schedule: "每周三、五 16:00-17:30" },
  { name: "水上救生员培训", level: "高级", coach: "刘教练", capacity: 10, price: 3000, venue: pool_a,
    start: 1.month.from_now, fin: 3.months.from_now, schedule: "每周六、日 09:00-12:00" },
  { name: "跳水基础", level: "初级", coach: "陈教练", capacity: 6, price: 2500, venue: pool_d,
    start: 2.weeks.from_now, fin: 8.weeks.from_now, schedule: "每周六 14:00-16:00" }
].each do |data|
  Course.find_or_create_by!(name: data[:name]) do |c|
    c.level = data[:level]
    c.coach = data[:coach]
    c.capacity = data[:capacity]
    c.price = data[:price]
    c.venue = data[:venue]
    c.start_date = data[:start]
    c.end_date = data[:fin]
    c.schedule_info = data[:schedule]
    c.status = "active"
    c.enrolled_count = 0
  end
end

spring_swim = Event.find_or_create_by!(name: "春季游泳锦标赛") do |e|
  e.description = "年度春季游泳锦标赛，设自由泳、蛙泳、仰泳、蝶泳四个项目"
  e.event_type = "锦标赛"
  e.start_date = 1.month.from_now
  e.end_date = 1.month.from_now + 2.days
  e.registration_start = Time.current
  e.registration_end = 3.weeks.from_now
  e.max_participants = 100
  e.registration_fee = 200
  e.status = "open"
  e.venue = pool_a
  e.rules = "1. 参赛者须身体健康\n2. 每人限报3个项目\n3. 比赛采用国家游泳协会最新规则"
  e.prizes = "各项目前3名颁发奖牌和证书，第1名额外奖金500元"
end

summer_relay = Event.find_or_create_by!(name: "夏季接力赛") do |e|
  e.description = "夏季4×100米混合接力赛"
  e.event_type = "接力赛"
  e.start_date = 2.months.from_now
  e.end_date = 2.months.from_now + 1.day
  e.registration_start = 1.week.from_now
  e.registration_end = 6.weeks.from_now
  e.max_participants = 40
  e.registration_fee = 500
  e.status = "draft"
  e.venue = pool_a
  e.rules = "1. 每队4人\n2. 蛙-仰-蝶-自顺序\n3. 接力时必须触壁后出发"
  e.prizes = "冠军队奖金2000元，亚军队1000元，季军队500元"
end

children_meet = Event.find_or_create_by!(name: "少儿游泳趣味赛") do |e|
  e.description = "面向6-14岁少儿的趣味游泳比赛"
  e.event_type = "趣味赛"
  e.start_date = 3.weeks.from_now
  e.end_date = 3.weeks.from_now
  e.registration_start = Time.current
  e.registration_end = 2.weeks.from_now
  e.max_participants = 60
  e.registration_fee = 50
  e.status = "open"
  e.venue = pool_c
  e.rules = "1. 6-14岁少儿均可参加\n2. 家长须签署安全协议\n3. 按年龄分组比赛"
  e.prizes = "参赛者均可获纪念奖牌，各组前3名额外奖品"
end

Course.all.each_with_index do |course, idx|
  enroll_count = [course.capacity, (3 + idx * 2)].min
  enrolled_users = members.shuffle.take(enroll_count)

  enrolled_users.each_with_index do |user, _i|
    enrollment = CourseEnrollment.find_or_create_by!(user: user, course: course) do |en|
      en.price = course.price
      en.status = "confirmed"
      en.payment_status = %w[paid paid paid paid unpaid failed].sample
      en.enrolled_at = (1..30).to_a.sample.days.ago
      en.source = %w[web web web admin].sample
    end

    if enrollment.payment_status == "paid"
      Payment.find_or_create_by!(payable: enrollment, user: user) do |p|
        p.amount = course.price
        p.status = "paid"
        p.payment_method = %w[alipay wechat bank_transfer].sample
        p.transaction_id = "TXN#{SecureRandom.hex(8).upcase}"
        p.paid_at = enrollment.enrolled_at
        p.source = enrollment.source
      end
    elsif enrollment.payment_status == "failed"
      Payment.find_or_create_by!(payable: enrollment, user: user) do |p|
        p.amount = course.price
        p.status = "failed"
        p.failure_reason = %w[支付网关超时 余额不足 银行卡过期].sample
        p.failed_at = 1.day.ago
        p.retry_count = [0, 1, 1, 2].sample
        p.source = enrollment.source
      end
    end

    if [true, false, false].sample && enrollment.confirmed?
      CheckIn.find_or_create_by!(user: user, checkinable: enrollment) do |ci|
        ci.status = "checked_in"
        ci.checked_in_at = (1..7).to_a.sample.days.ago
        ci.check_in_method = %w[manual qr_code].sample
        ci.source = "web"
      end
    end
  end

  course.update_column(:enrolled_count, course.course_enrollments.where(status: %w[confirmed pending]).count)
end

[spring_swim, children_meet].each do |event|
  reg_count = [event.max_participants, 15].min
  registered_users = members.shuffle.take(reg_count)

  registered_users.each do |user|
    registration = EventRegistration.find_or_create_by!(user: user, event: event) do |er|
      er.category = %w[自由泳 蛙泳 仰泳 蝶泳].sample
      er.status = "confirmed"
      er.payment_status = %w[paid paid unpaid].sample
      er.registration_fee = event.registration_fee
      er.registered_at = (1..14).to_a.sample.days.ago
      er.source = %w[web admin].sample
    end

    if registration.payment_status == "paid"
      Payment.find_or_create_by!(payable: registration, user: user) do |p|
        p.amount = event.registration_fee
        p.status = "paid"
        p.payment_method = %w[alipay wechat cash].sample
        p.transaction_id = "TXN#{SecureRandom.hex(8).upcase}"
        p.paid_at = registration.registered_at
        p.source = registration.source
      end
    end

    if [true, false, false].sample
      CheckIn.find_or_create_by!(user: user, checkinable: registration) do |ci|
        ci.status = "checked_in"
        ci.checked_in_at = (1..5).to_a.sample.days.ago
        ci.check_in_method = %w[manual qr_code staff].sample
        ci.source = "admin"
      end
    end
  end
end

CourseEnrollment.confirmed.each do |enrollment|
  if [true, false, false, false].sample
    LeaveRequest.find_or_create_by!(
      user: enrollment.user,
      course_enrollment: enrollment,
      leave_date: (1..14).to_a.sample.days.from_now
    ) do |lr|
      lr.reason = %w[身体不适 家里有事 出差 学校考试].sample
      lr.status = %w[pending pending approved rejected].sample
      if lr.status.in?(%w[approved rejected])
        lr.approved_by = supervisor
        lr.approved_at = 1.day.ago
        lr.approve_note = lr.status == "approved" ? "同意请假" : "请补课后再申请"
      end
    end
  end
end

[VenueBooking.find_or_create_by!(venue: pool_a, user: members.first, start_time: 1.day.from_now.change(hour: 8), end_time: 1.day.from_now.change(hour: 10)) do |vb|
  vb.purpose = "训练"
  vb.status = "confirmed"
  vb.source = "admin"
end,
VenueBooking.find_or_create_by!(venue: pool_b, user: members.second, start_time: 2.days.from_now.change(hour: 14), end_time: 2.days.from_now.change(hour: 16)) do |vb|
  vb.purpose = "私教课"
  vb.status = "confirmed"
  vb.source = "web"
end,
VenueBooking.find_or_create_by!(venue: pool_c, user: members.third, start_time: 3.days.from_now.change(hour: 10), end_time: 3.days.from_now.change(hour: 12)) do |vb|
  vb.purpose = "亲子活动"
  vb.status = "pending"
  vb.source = "web"
end]

puts "种子数据创建完成！"
puts "管理员: #{admin.email} / password123"
puts "主管: #{supervisor.email} / password123"
puts "普通用户: member1@example.com ~ member20@example.com / password123"
