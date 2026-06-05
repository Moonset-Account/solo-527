puts "=== 开始初始化志愿者排班平台数据 ==="

if Rails.env.development?
  puts "清空现有数据..."
  AdminConfirmation.delete_all
  CheckInReview.delete_all
  CheckIn.delete_all
  AssignmentChange.delete_all
  Assignment.delete_all
  ServiceCertificate.delete_all
  Notification.delete_all
  ActiveRecord::Base.connection.execute("DELETE FROM location_skills")
  Location.delete_all
  Activity.delete_all
  Guardian.delete_all
  EmergencyContact.delete_all
  Availability.delete_all
  VolunteerSkill.delete_all
  VolunteerProfile.delete_all
  User.delete_all
  Skill.delete_all
end

puts "创建技能数据..."
skills = [
  { name: "急救", category: "医疗", description: "具备基本急救知识和技能" },
  { name: "护理", category: "医疗", description: "专业护理技能" },
  { name: "英语", category: "教育", description: "英语教学能力" },
  { name: "数学", category: "教育", description: "数学教学能力" },
  { name: "驾驶", category: "其他", description: "具备驾驶执照" },
  { name: "摄影", category: "其他", description: "专业摄影技能" },
  { name: "编程", category: "技术", description: "软件开发能力" },
  { name: "策划", category: "行政", description: "活动策划能力" }
]

skills.each do |skill_attrs|
  Skill.find_or_create_by!(name: skill_attrs[:name]) do |skill|
    skill.category = skill_attrs[:category]
    skill.description = skill_attrs[:description]
  end
end

puts "创建用户账号..."

admin = User.create!(
  email: "admin@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "系统管理员",
  phone: "13800000001",
  role: :admin
)

admin2 = User.create!(
  email: "admin2@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "管理员二号",
  phone: "13800000002",
  role: :admin
)

pm = User.create!(
  email: "manager@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "项目张经理",
  phone: "13900000001",
  role: :project_manager
)

volunteer1 = User.create!(
  email: "volunteer1@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "李志愿者",
  phone: "13700000001",
  role: :volunteer
)

volunteer2 = User.create!(
  email: "volunteer2@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "王志愿者",
  phone: "13700000002",
  role: :volunteer
)

minor_volunteer = User.create!(
  email: "minor@example.com",
  password: "password123",
  password_confirmation: "password123",
  name: "张同学",
  phone: "13700000003",
  role: :volunteer
)

puts "完善志愿者档案..."

vp1 = volunteer1.volunteer_profile
vp1.update!(
  birth_date: 25.years.ago.to_date,
  gender: "男",
  address: "北京市朝阳区建国路88号",
  latitude: 39.9042,
  longitude: 116.4074,
  bio: "热心公益，有5年志愿服务经验"
)

vp2 = volunteer2.volunteer_profile
vp2.update!(
  birth_date: 30.years.ago.to_date,
  gender: "女",
  address: "北京市海淀区中关村大街1号",
  latitude: 39.9847,
  longitude: 116.3046,
  bio: "护士专业，有医疗救护经验"
)

vp_minor = minor_volunteer.volunteer_profile
vp_minor.update!(
  birth_date: 15.years.ago.to_date,
  gender: "男",
  address: "北京市西城区",
  latitude: 39.9128,
  longitude: 116.3634,
  bio: "高中生，希望参与社会实践"
)

puts "添加志愿者技能..."
VolunteerSkill.create!(volunteer_profile: vp1, skill: Skill.find_by(name: "急救"), proficiency: 3)
VolunteerSkill.create!(volunteer_profile: vp1, skill: Skill.find_by(name: "驾驶"), proficiency: 4)
VolunteerSkill.create!(volunteer_profile: vp2, skill: Skill.find_by(name: "护理"), proficiency: 5)
VolunteerSkill.create!(volunteer_profile: vp2, skill: Skill.find_by(name: "急救"), proficiency: 4)
VolunteerSkill.create!(volunteer_profile: vp_minor, skill: Skill.find_by(name: "英语"), proficiency: 3)

puts "添加可用时段..."
[vp1, vp2, vp_minor].each do |vp|
  (1..5).each do |day|
    Availability.create!(
      volunteer_profile: vp,
      day_of_week: day,
      start_time: "09:00:00",
      end_time: "18:00:00"
    )
  end
  Availability.create!(
    volunteer_profile: vp,
    day_of_week: 6,
    start_time: "10:00:00",
    end_time: "16:00:00"
  )
end

puts "添加紧急联系人..."
EmergencyContact.create!(
  volunteer_profile: vp1,
  name: "李妈妈",
  relationship: "母亲",
  phone: "13600000001",
  is_primary: true
)
EmergencyContact.create!(
  volunteer_profile: vp2,
  name: "王先生",
  relationship: "配偶",
  phone: "13600000002",
  is_primary: true
)

puts "添加未成年人监护人信息..."
Guardian.create!(
  volunteer_profile: vp_minor,
  name: "张爸爸",
  relationship: "父亲",
  phone: "13600000003",
  email: "zhang@example.com",
  consent_given: true,
  consent_given_at: Time.current
)

puts "创建活动和点位..."
activity1 = Activity.create!(
  title: "社区医疗义诊活动",
  description: "为社区居民提供免费医疗咨询和基础检查服务",
  project_manager: pm,
  start_time: 7.days.from_now.change(hour: 9),
  end_time: 7.days.from_now.change(hour: 17),
  status: :published,
  category: "医疗",
  volunteers_needed: 5
)

location1 = Location.create!(
  activity: activity1,
  name: "朝阳社区活动中心",
  address: "北京市朝阳区建国路100号",
  latitude: 39.9087,
  longitude: 116.4102,
  volunteers_needed: 3,
  instructions: "请提前30分钟到达，穿志愿者服装"
)

location1.required_skills << Skill.find_by(name: "急救")
location1.required_skills << Skill.find_by(name: "护理")

location2 = Location.create!(
  activity: activity1,
  name: "社区广场服务点",
  address: "北京市朝阳区建国路150号",
  latitude: 39.9095,
  longitude: 116.4120,
  volunteers_needed: 2,
  instructions: "负责引导和登记"
)

activity2 = Activity.create!(
  title: "山区支教活动",
  description: "为山区小学提供支教服务",
  project_manager: pm,
  start_time: 14.days.from_now.change(hour: 8),
  end_time: 21.days.from_now.change(hour: 18),
  status: :draft,
  category: "教育",
  volunteers_needed: 10
)

Location.create!(
  activity: activity2,
  name: "希望小学",
  address: "河北省张家口市某某县希望小学",
  latitude: 40.8426,
  longitude: 114.8828,
  volunteers_needed: 10,
  instructions: "需自带生活用品，住宿由学校安排"
)

puts "=== 创建验收样例 ==="

puts "=== 样例1：正常提交流程 ==="
assignment1 = Assignment.create!(
  volunteer_profile: vp2,
  location: location1,
  activity: activity1,
  status: :accepted,
  accepted_at: 2.days.ago
)

puts "  - 志愿者 #{volunteer2.name} 已接受 #{activity1.title} 排班"
puts "  - 匹配原因：#{assignment1.match_reason}"

check_in_normal = CheckIn.new(
  assignment: assignment1,
  checked_in_at: 7.days.ago.change(hour: 8, min: 55),
  checked_out_at: 7.days.ago.change(hour: 17, min: 5),
  service_hours: 8.0,
  status: :approved,
  check_in_method: "qr_code",
  check_in_latitude: 39.9087,
  check_in_longitude: 116.4102
)
check_in_normal.save!(validate: false)

puts "  - 已完成正常签到和签退，服务时长 8 小时，状态：已通过"

certificate = ServiceCertificate.issue_for(
  vp2,
  30.days.ago.to_date,
  Date.today,
  admin
)
puts "  - 已开具服务证明：#{certificate.certificate_number}，总时长：#{certificate.total_hours} 小时"

puts "\n=== 样例2：退回修改流程 ==="

assignment2 = Assignment.create!(
  volunteer_profile: vp1,
  location: location1,
  activity: activity1,
  status: :accepted,
  accepted_at: 1.day.ago
)

check_in_late = CheckIn.new(
  assignment: assignment2,
  checked_in_at: 5.days.ago.change(hour: 9, min: 30),
  checked_out_at: 5.days.ago.change(hour: 17, min: 0),
  service_hours: 7.5,
  status: :needs_review,
  is_late: true,
  check_in_method: "qr_code",
  review_reason: "迟到 30 分钟"
)
check_in_late.save!(validate: false)

puts "  - 志愿者 #{volunteer1.name} 迟到 30 分钟签到"
puts "  - 签到状态：需要人工复核"
puts "  - 复核原因：#{check_in_late.review_reason}"

CheckInReview.create!(
  check_in: check_in_late,
  reviewer: admin,
  decision: :sent_back,
  review_notes: "迟到超过15分钟，请补充说明原因",
  reviewed_at: Time.current
)

puts "  - 管理员 #{admin.name} 已退回修改，要求补充迟到原因"

manual_check_in = CheckIn.new(
  assignment: assignment2,
  checked_in_at: 3.days.ago.change(hour: 10),
  service_hours: 0,
  status: :needs_review,
  check_in_method: "manual",
  needs_review: true,
  review_reason: "人工补签到，需要两名管理员确认"
)
manual_check_in.save!(validate: false)

puts "\n  - 人工补签到记录已创建"
puts "  - 当前管理员确认数：#{manual_check_in.admin_confirmations.count}/2"

AdminConfirmation.create!(
  confirmable: manual_check_in,
  admin: admin,
  confirmation_notes: "已核实情况属实",
  confirmed_at: Time.current
)

puts "  - 第一名管理员确认：#{admin.name}"
puts "  - 当前管理员确认数：#{manual_check_in.reload.admin_confirmations.count}/2，状态：待第二名管理员确认"

puts "\n=== 样例3：权限拦截验证 ==="

permission_tests = [
  {
    user: volunteer1,
    action: "尝试创建活动",
    expected: "被拦截（只有项目负责人和管理员可以创建活动）"
  },
  {
    user: volunteer2,
    action: "尝试审批签到",
    expected: "被拦截（只有管理员可以审批签到）"
  },
  {
    user: pm,
    action: "尝试撤销服务证明",
    expected: "被拦截（只有管理员可以撤销服务证明）"
  },
  {
    user: volunteer1,
    action: "尝试查看志愿者 #{volunteer2.name} 的档案",
    expected: "被拦截（只能查看自己的档案）"
  }
]

permission_tests.each do |test|
  puts "  - 用户 #{test[:user].name}（角色：#{test[:user].role}）#{test[:action]}"
  puts "    预期结果：#{test[:expected]}"
end

puts "\n=== 志愿者调换样例 ==="
location3 = activity2.locations.first
assignment_swap = Assignment.create!(
  volunteer_profile: vp1,
  location: location3,
  activity: activity2,
  status: :accepted,
  accepted_at: 1.day.ago
)

puts "  - 原排班：#{volunteer1.name} → #{location3.name}"
puts "  - 原匹配原因：#{assignment_swap.match_reason}"

old_vp = vp1
new_vp = vp_minor
assignment_swap.swap!(new_vp, pm, "原志愿者临时有事")

change_record = assignment_swap.assignment_changes.last
puts "  - 调换后：#{new_vp.user.name} → #{location3.name}"
puts "  - 调换人：#{pm.name}"
puts "  - 原匹配原因已保留：#{change_record.original_match_reason}"
puts "  - 调换原因：#{change_record.change_reason}"

puts "\n=== 防重复开具证明验证 ==="
begin
  duplicate_cert = ServiceCertificate.issue_for(
    vp2,
    30.days.ago.to_date,
    Date.today,
    admin
  )
  puts "  - 错误：重复开具成功（不应该发生）"
rescue => e
  puts "  - 尝试重复开具证明：已拦截，错误信息：#{e.message}"
end

puts "\n=== 数据初始化完成 ==="
puts "\n登录账号："
puts "  管理员：admin@example.com / password123"
puts "  管理员2：admin2@example.com / password123"
puts "  项目负责人：manager@example.com / password123"
puts "  志愿者（李）：volunteer1@example.com / password123"
puts "  志愿者（王）：volunteer2@example.com / password123"
puts "  未成年志愿者：minor@example.com / password123"
