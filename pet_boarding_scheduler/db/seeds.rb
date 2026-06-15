Pet.find_or_create_by!(id: 1) do |pet|
  pet.name = "小黑"
  pet.species = "狗"
  pet.breed = "拉布拉多"
  pet.age = 3
  pet.weight = 25.5
  pet.gender = "公"
  pet.owner_name = "张三"
  pet.owner_phone = "13800138001"
  pet.owner_email = "zhangsan@example.com"
  pet.medical_notes = "每年接种疫苗"
  pet.allergies = "无"
  pet.special_needs = "每天需要散步两次"
  pet.active = true
end

Pet.find_or_create_by!(id: 2) do |pet|
  pet.name = "小白"
  pet.species = "猫"
  pet.breed = "英国短毛猫"
  pet.age = 2
  pet.weight = 4.2
  pet.gender = "母"
  pet.owner_name = "李四"
  pet.owner_phone = "13800138002"
  pet.owner_email = "lisi@example.com"
  pet.medical_notes = ""
  pet.allergies = "对某种食物过敏"
  pet.special_needs = "比较胆小，需要安静环境"
  pet.active = true
end

Pet.find_or_create_by!(id: 3) do |pet|
  pet.name = "大黄"
  pet.species = "狗"
  pet.breed = "金毛"
  pet.age = 5
  pet.weight = 30.0
  pet.gender = "公"
  pet.owner_name = "王五"
  pet.owner_phone = "13800138003"
  pet.owner_email = "wangwu@example.com"
  pet.medical_notes = "关节有些问题"
  pet.allergies = "无"
  pet.special_needs = "需要控制饮食"
  pet.active = true
end

Caretaker.find_or_create_by!(id: 1) do |c|
  c.name = "王小明"
  c.phone = "13900139001"
  c.email = "wangxiaoming@example.com"
  c.bio = "5年宠物寄养经验，擅长训练狗狗"
  c.active = true
  c.max_pets_capacity = 5
end

Caretaker.find_or_create_by!(id: 2) do |c|
  c.name = "李小红"
  c.phone = "13900139002"
  c.email = "lixiaohong@example.com"
  c.bio = "3年经验，猫咪护理专家"
  c.active = true
  c.max_pets_capacity = 6
end

Caretaker.find_or_create_by!(id: 3) do |c|
  c.name = "张小华"
  c.phone = "13900139003"
  c.email = "zhangxiaohua@example.com"
  c.bio = "兽医专业背景，注重健康管理"
  c.active = true
  c.max_pets_capacity = 4
end

Kennel.find_or_create_by!(id: 1) do |k|
  k.name = "A-101"
  k.size_category = "小型"
  k.location = "A区一楼"
  k.status = :available
  k.daily_rate = 80.0
  k.notes = "适合小型犬和猫"
end

Kennel.find_or_create_by!(id: 2) do |k|
  k.name = "A-102"
  k.size_category = "小型"
  k.location = "A区一楼"
  k.status = :available
  k.daily_rate = 80.0
  k.notes = "适合小型犬和猫"
end

Kennel.find_or_create_by!(id: 3) do |k|
  k.name = "B-201"
  k.size_category = "中型"
  k.location = "B区二楼"
  k.status = :occupied
  k.daily_rate = 120.0
  k.notes = "适合中型犬"
end

Kennel.find_or_create_by!(id: 4) do |k|
  k.name = "B-202"
  k.size_category = "中型"
  k.location = "B区二楼"
  k.status = :available
  k.daily_rate = 120.0
  k.notes = "适合中型犬"
end

Kennel.find_or_create_by!(id: 5) do |k|
  k.name = "C-301"
  k.size_category = "大型"
  k.location = "C区三楼"
  k.status = :available
  k.daily_rate = 180.0
  k.notes = "适合大型犬"
end

Kennel.find_or_create_by!(id: 6) do |k|
  k.name = "C-302"
  k.size_category = "大型"
  k.location = "C区三楼"
  k.status = :maintenance
  k.daily_rate = 180.0
  k.notes = "维修中"
end

Service.find_or_create_by!(id: 1) do |s|
  s.name = "基础寄养"
  s.description = "包含日常喂食、遛弯、清洁"
  s.duration_minutes = 1440
  s.price = 100.0
  s.category = "boarding"
  s.is_active = true
end

Service.find_or_create_by!(id: 2) do |s|
  s.name = "豪华寄养"
  s.description = "大空间、多次遛弯、每日互动"
  s.duration_minutes = 1440
  s.price = 200.0
  s.category = "boarding"
  s.is_active = true
end

Service.find_or_create_by!(id: 3) do |s|
  s.name = "基础训练"
  s.description = "基础服从性训练"
  s.duration_minutes = 60
  s.price = 150.0
  s.category = "training"
  s.is_active = true
end

Service.find_or_create_by!(id: 4) do |s|
  s.name = "进阶训练"
  s.description = "技能训练和行为矫正"
  s.duration_minutes = 90
  s.price = 250.0
  s.category = "training"
  s.is_active = true
end

Service.find_or_create_by!(id: 5) do |s|
  s.name = "洗澡美容"
  s.description = "洗澡、吹干、修剪指甲"
  s.duration_minutes = 90
  s.price = 120.0
  s.category = "grooming"
  s.is_active = true
end

Service.find_or_create_by!(id: 6) do |s|
  s.name = "健康检查"
  s.description = "常规健康检查"
  s.duration_minutes = 30
  s.price = 80.0
  s.category = "medical"
  s.is_active = true
end

User.find_or_create_by!(id: 1) do |u|
  u.email = "admin@example.com"
  u.password_digest = BCrypt::Password.create("password123")
  u.name = "系统管理员"
  u.role = "admin"
  u.active = true
end

User.find_or_create_by!(id: 2) do |u|
  u.email = "manager@example.com"
  u.password_digest = BCrypt::Password.create("password123")
  u.name = "店长"
  u.role = "manager"
  u.active = true
end

User.find_or_create_by!(id: 3) do |u|
  u.email = "staff@example.com"
  u.password_digest = BCrypt::Password.create("password123")
  u.name = "员工"
  u.role = "staff"
  u.active = true
end

reservation1 = BoardingReservation.find_or_create_by!(id: 1) do |r|
  r.pet_id = 1
  r.caretaker_id = 1
  r.kennel_id = 3
  r.check_in_at = 2.days.ago
  r.check_out_at = 5.days.from_now
  r.status = :checked_in
  r.total_price = 840.0
  r.notes = "每天遛弯两次"
  r.special_requests = "不吃鸡肉"
end

reservation2 = BoardingReservation.find_or_create_by!(id: 2) do |r|
  r.pet_id = 2
  r.caretaker_id = 2
  r.kennel_id = 1
  r.check_in_at = 1.day.ago
  r.check_out_at = 3.days.from_now
  r.status = :checked_in
  r.total_price = 320.0
  r.notes = "需要安静环境"
  r.special_requests = "特殊猫粮"
end

HealthRecord.find_or_create_by!(id: 1) do |h|
  h.pet_id = 1
  h.caretaker_id = 1
  h.temperature = 38.5
  h.weight = 25.5
  h.appetite_level = 4
  h.activity_level = 4
  h.symptoms = ""
  h.notes = "状态良好"
  h.recorded_at = 1.day.ago
end

HealthRecord.find_or_create_by!(id: 2) do |h|
  h.pet_id = 1
  h.caretaker_id = 3
  h.temperature = 38.6
  h.weight = 25.3
  h.appetite_level = 3
  h.activity_level = 3
  h.symptoms = "食欲稍差"
  h.notes = "继续观察"
  h.recorded_at = Time.current
end

HealthRecord.find_or_create_by!(id: 3) do |h|
  h.pet_id = 2
  h.caretaker_id = 2
  h.temperature = 38.2
  h.weight = 4.2
  h.appetite_level = 5
  h.activity_level = 4
  h.symptoms = ""
  h.notes = "状态良好"
  h.recorded_at = Time.current
end

TrainingRecord.find_or_create_by!(id: 1) do |t|
  t.pet_id = 1
  t.caretaker_id = 1
  t.service_id = 3
  t.training_date = Date.yesterday
  t.duration_minutes = 60
  t.content = "基础服从训练：坐、卧、等待"
  t.progress = "完成度80%，等待还需要加强"
  t.notes = ""
  t.delay_reason = nil
  t.status = :completed
end

TrainingRecord.find_or_create_by!(id: 2) do |t|
  t.pet_id = 1
  t.caretaker_id = 1
  t.service_id = 3
  t.training_date = Date.today
  t.duration_minutes = 60
  t.content = "进阶训练：随行"
  t.progress = ""
  t.notes = ""
  t.delay_reason = nil
  t.status = :scheduled
end

TrainingRecord.find_or_create_by!(id: 3) do |t|
  t.pet_id = 3
  t.caretaker_id = 1
  t.service_id = 4
  t.training_date = Date.today
  t.duration_minutes = 90
  t.content = "行为矫正：捡食"
  t.progress = ""
  t.notes = ""
  t.delay_reason = "宠物状态不佳"
  t.status = :delayed
end

SafetyIncident.find_or_create_by!(id: 1) do |s|
  s.pet_id = 1
  s.caretaker_id = 1
  s.kennel_id = 3
  s.incident_type = "逃跑"
  s.severity = :medium
  s.description = "遛弯时挣脱牵引绳，跑了约50米后被追回"
  s.action_taken = "已更换更牢固的牵引绳，加强训练"
  s.occurred_at = 5.days.ago
  s.resolved_at = 5.days.ago + 2.hours
end

SafetyIncident.find_or_create_by!(id: 2) do |s|
  s.pet_id = 3
  s.caretaker_id = 3
  s.kennel_id = 5
  s.incident_type = "疾病"
  s.severity = :low
  s.description = "轻微腹泻，食欲正常"
  s.action_taken = "调整饮食，持续观察"
  s.occurred_at = 2.days.ago
  s.resolved_at = 1.day.ago
end

Notification.find_or_create_by!(id: 1) do |n|
  n.title = "健康预警：小黑"
  n.content = "食欲评分低于正常水平，请关注。"
  n.notification_type = "health"
  n.is_read = false
  n.read_at = nil
  n.notifiable_type = "Pet"
  n.notifiable_id = 1
end

Notification.find_or_create_by!(id: 2) do |n|
  n.title = "训练延期提醒"
  n.content = "大黄的进阶训练因宠物状态不佳延期"
  n.notification_type = "training"
  n.is_read = false
  n.read_at = nil
  n.notifiable_type = "TrainingRecord"
  n.notifiable_id = 3
end
