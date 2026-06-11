puts "开始创建种子数据..."

ActiveRecord::Base.transaction do
  puts "创建医生..."
  doctor1 = Doctor.create!(
    name: "张医生",
    title: "主任医师",
    department: "牙周科",
    phone: "13800138001",
    daily_max_patients: 20,
    active: true
  )

  doctor2 = Doctor.create!(
    name: "李医生",
    title: "副主任医师",
    department: "牙周科",
    phone: "13800138002",
    daily_max_patients: 18,
    active: true
  )

  doctor3 = Doctor.create!(
    name: "王医生",
    title: "主治医师",
    department: "口腔预防科",
    phone: "13800138003",
    daily_max_patients: 15,
    active: true
  )
  puts "医生创建完成"

  puts "创建服务项目..."
  ServiceItem.create!(
    code: "JY001",
    name: "基础洁牙",
    price: 198.00,
    duration_minutes: 30,
    category: "cleaning",
    description: "超声波洁牙+抛光",
    active: true
  )

  ServiceItem.create!(
    code: "JY002",
    name: "深度洁牙",
    price: 398.00,
    duration_minutes: 60,
    category: "cleaning",
    description: "超声波洁牙+喷砂+抛光",
    active: true
  )

  ServiceItem.create!(
    code: "JY003",
    name: "舒适洁牙",
    price: 698.00,
    duration_minutes: 45,
    category: "cleaning",
    description: "无痛舒适洁牙套餐",
    active: true
  )

  ServiceItem.create!(
    code: "JY004",
    name: "儿童洁牙",
    price: 158.00,
    duration_minutes: 30,
    category: "cleaning",
    description: "专为儿童设计的温和洁牙",
    active: true
  )
  puts "服务项目创建完成"

  puts "创建客户..."
  customers = [
    { name: "王小明", phone: "13900139001", vip: true, gender: "男" },
    { name: "李小红", phone: "13900139002", vip: false, gender: "女" },
    { name: "张大伟", phone: "13900139003", vip: false, gender: "男" },
    { name: "刘美丽", phone: "13900139004", vip: true, gender: "女" },
    { name: "陈志远", phone: "13900139005", vip: false, gender: "男" },
    { name: "赵雅婷", phone: "13900139006", vip: false, gender: "女" },
    { name: "孙国强", phone: "13900139007", vip: true, gender: "男" },
    { name: "周慧敏", phone: "13900139008", vip: false, gender: "女" }
  ]

  customers.each do |c|
    Customer.create!(c)
  end
  puts "客户创建完成"

  puts "创建候补释放规则..."
  WaitingListRule.create!(
    name: "默认规则",
    release_minutes_before: 60,
    max_waiting_per_slot: 5,
    confirmation_timeout_minutes: 15,
    auto_notify: true,
    active: true,
    priority: 1,
    notify_channel: "sms",
    description: "时段开始前60分钟自动释放候补位，客户需15分钟内确认"
  )

  WaitingListRule.create!(
    name: "VIP加急规则",
    release_minutes_before: 120,
    max_waiting_per_slot: 8,
    confirmation_timeout_minutes: 30,
    auto_notify: true,
    active: true,
    priority: 0,
    notify_channel: "sms",
    description: "提前2小时释放，确认时间延长至30分钟"
  )
  puts "候补释放规则创建完成"

  puts "创建未来7天的时段..."
  base_date = Date.today
  doctors = [doctor1, doctor2, doctor3]

  doctors.each do |doctor|
    (0..6).each do |day_offset|
      date = base_date + day_offset
      next if date.saturday? || date.sunday?

      morning_slots = [
        ["09:00", "09:30"], ["09:30", "10:00"], ["10:00", "10:30"],
        ["10:30", "11:00"], ["11:00", "11:30"]
      ]

      afternoon_slots = [
        ["14:00", "14:30"], ["14:30", "15:00"], ["15:00", "15:30"],
        ["15:30", "16:00"], ["16:00", "16:30"], ["16:30", "17:00"]
      ]

      (morning_slots + afternoon_slots).each do |start_t, end_t|
        start_time = DateTime.parse("#{date} #{start_t}")
        end_time = DateTime.parse("#{date} #{end_t}")

        TimeSlot.create!(
          doctor: doctor,
          start_time: start_time,
          end_time: end_time,
          capacity: [1, 2].sample,
          status: "available"
        )
      end
    end
  end
  puts "时段创建完成"

  puts "创建示例预约和候补..."
  all_customers = Customer.all
  all_slots = TimeSlot.all
  all_services = ServiceItem.dental_cleaning.to_a
  rule = WaitingListRule.default_rule

  15.times do |i|
    slot = all_slots.sample
    customer = all_customers.sample

    if slot.has_available_spots?
      apt = Appointment.create_direct!(
        customer, slot.doctor, slot,
        service_items: [all_services.sample],
        operator: "seed"
      )
      apt.update!(paid_amount: apt.total_amount)
      apt.confirm_appointment! if apt.may_confirm_appointment?
    end
  end

  8.times do |i|
    slot = all_slots.sample
    customer = all_customers.reject { |c| c.waiting_lists.exists?(time_slot: slot, status: ["waiting", "notified", "confirmed"]) }.sample
    next unless customer

    WaitingList.add_customer(
      customer, slot.doctor,
      time_slot: slot,
      service_item: all_services.sample,
      rule: rule,
      operator: "seed"
    )
  end

  puts "示例数据创建完成"
end

puts "种子数据全部创建成功！"
