puts "开始创建测试数据..."

User.create!(
  username: 'admin',
  password: '123456',
  password_confirmation: '123456',
  email: 'admin@example.com',
  real_name: '系统管理员',
  role: 'admin',
  department: '信息部',
  phone: '13800000001',
  active: true
)
puts "创建管理员账号: admin / 123456"

User.create!(
  username: 'safety',
  password: '123456',
  password_confirmation: '123456',
  email: 'safety@example.com',
  real_name: '张安全',
  role: 'safety_officer',
  department: '安全部',
  phone: '13800000002',
  active: true
)
puts "创建安全员账号: safety / 123456"

User.create!(
  username: 'approver',
  password: '123456',
  password_confirmation: '123456',
  email: 'approver@example.com',
  real_name: '李审批',
  role: 'approver',
  department: '项目管理部',
  phone: '13800000003',
  active: true
)
puts "创建审批人账号: approver / 123456"

User.create!(
  username: 'guard',
  password: '123456',
  password_confirmation: '123456',
  email: 'guard@example.com',
  real_name: '王门卫',
  role: 'guard',
  department: '保卫部',
  phone: '13800000004',
  active: true
)
puts "创建门岗账号: guard / 123456"

User.create!(
  username: 'staff',
  password: '123456',
  password_confirmation: '123456',
  email: 'staff@example.com',
  real_name: '赵员工',
  role: 'staff',
  department: '工程部',
  phone: '13800000005',
  active: true
)
puts "创建普通员工账号: staff / 123456"

zones = [
  { name: '办公区域', code: 'OFFICE-001', zone_type: 'office', location: 'A栋1-5层', requires_second_approval: false },
  { name: '材料仓储区', code: 'STORAGE-001', zone_type: 'storage', location: '西南角仓库', requires_second_approval: false },
  { name: '主体施工区', code: 'WORK-001', zone_type: 'normal', location: '1号楼施工现场', requires_second_approval: false },
  { name: '高空作业区', code: 'WORK-002', zone_type: 'dangerous', location: '1号楼15层以上', requires_second_approval: true, max_capacity: 10 },
  { name: '电焊作业区', code: 'WORK-003', zone_type: 'dangerous', location: '2号楼东侧', requires_second_approval: true, max_capacity: 5 },
  { name: '危险品存放区', code: 'DANGER-001', zone_type: 'dangerous', location: '西北角独立库房', requires_second_approval: true, max_capacity: 3 },
  { name: '设备安装区', code: 'WORK-004', zone_type: 'normal', location: '3号楼', requires_second_approval: false },
  { name: '管制区域', code: 'RESTRICT-001', zone_type: 'restricted', location: '项目经理部', requires_second_approval: false }
]

zones.each do |zone_params|
  WorkZone.create!(zone_params)
end
puts "创建了 #{WorkZone.count} 个作业区域"

people_data = [
  { name: '张三', id_card: '110101199001011234', gender: '男', phone: '13900001111', company: '中建一局', person_type: 'worker' },
  { name: '李四', id_card: '110101199002022345', gender: '男', phone: '13900002222', company: '中建一局', person_type: 'worker' },
  { name: '王五', id_card: '110101199103033456', gender: '女', phone: '13900003333', company: '中建二局', person_type: 'worker' },
  { name: '赵六', id_card: '110101199204044567', gender: '男', phone: '13900004444', company: '甲方监理', person_type: 'visitor' },
  { name: '钱七', id_card: '110101199305055678', gender: '男', phone: '13900005555', company: '钢材供应商', person_type: 'supplier' },
  { name: '孙八', id_card: '110101199406066789', gender: '男', phone: '13900006666', company: '装修分包', person_type: 'contractor' },
  { name: '周九', id_card: '110101199507077890', gender: '女', phone: '13900007777', company: '设计院', person_type: 'visitor' },
  { name: '吴十', id_card: '110101199608088901', gender: '男', phone: '13900008888', company: '设备安装队', person_type: 'worker' }
]

people_data.each do |person_params|
  person = Person.create!(person_params)

  Credential.create!(
    person: person,
    credential_type: 'id_card',
    credential_number: person_params[:id_card],
    issuing_authority: '北京市公安局',
    verified: true,
    verified_at: Time.current,
    verifier: User.first
  )

  if person_params[:person_type] == 'worker'
    Credential.create!(
      person: person,
      credential_type: 'special_operation',
      credential_number: "TZ#{SecureRandom.hex(4).upcase}",
      issuing_authority: '住建委',
      issue_date: 1.year.ago.to_date,
      expiry_date: 1.year.from_now.to_date,
      credential_level: '中级',
      verified: true,
      verified_at: Time.current,
      verifier: User.first
    )
  end
end
puts "创建了 #{Person.count} 个人员和相关证件"

vehicles_data = [
  { plate_number: '京A12345', vehicle_type: 'truck', color: '蓝色', brand_model: '东风自卸车', remark: '中建一局' },
  { plate_number: '京B67890', vehicle_type: 'van', color: '白色', brand_model: '金杯面包车', remark: '物资部' },
  { plate_number: '京C11111', vehicle_type: 'car', color: '黑色', brand_model: '帕萨特', remark: '项目部' },
  { plate_number: '京D22222', vehicle_type: 'engineering', color: '黄色', brand_model: '徐工吊车', remark: '设备租赁' },
  { plate_number: '京E33333', vehicle_type: 'dangerous', color: '红色', brand_model: '油罐车', remark: '油料供应' }
]

vehicles_data.each do |vehicle_params|
  Vehicle.create!(vehicle_params)
end
puts "创建了 #{Vehicle.count} 辆车"

admin_user = User.find_by(username: 'admin')
safety_user = User.find_by(username: 'safety')
approver_user = User.find_by(username: 'approver')

work_zones = WorkZone.all
people = Person.all
vehicles = Vehicle.all

people.each_with_index do |person, i|
  pass = Pass.create!(
    person: person,
    vehicle: i < vehicles.count ? vehicles[i] : nil,
    pass_type: i < 3 ? 'long_term' : (i < 5 ? 'daily' : 'temporary'),
    purpose: ['日常工作', '材料运输', '设备检修', '现场勘查', '会议访问'].sample,
    valid_from: Date.current,
    valid_until: (i < 3 ? 3.months : i < 5 ? 1.week : 1.day).from_now,
    status: 'pending',
    creator: admin_user
  )

  pass_work_zone_count = [1, 2, 3].sample
  selected_zones = work_zones.sample(pass_work_zone_count)
  selected_zones.each do |zone|
    pass.pass_work_zones.create!(work_zone: zone, granted_at: Time.current)
  end

  if i < 4
    pass.approvals.create!(approval_level: 1, status: 'approved', approver: approver_user, approved_at: Time.current)
    if pass.requires_second_approval?
      pass.approvals.create!(approval_level: 2, status: 'pending')
    end
    pass.status = 'approved'
    pass.save!
  else
    pass.approvals.create!(approval_level: 1, status: 'pending')
    if pass.requires_second_approval?
      pass.approvals.create!(approval_level: 2, status: 'pending')
    end
  end
end
puts "创建了 #{Pass.count} 个通行证和 #{Approval.count} 条审批记录"

violation_types = %w[unauthorized_access zone_violation no_pass safety_violation expired_pass]
severities = %w[minor medium major critical]

5.times do |i|
  person = people[i]
  pass = person.passes.first

  Violation.create!(
    person: person,
    vehicle: pass&.vehicle,
    pass: pass,
    work_zone: work_zones.sample,
    violation_type: violation_types.sample,
    description: Faker::Lorem.sentence,
    violated_at: (i + 1).days.ago,
    location: work_zones.sample&.location,
    reporter: safety_user,
    severity: severities.sample,
    status: i < 2 ? 'handled' : 'reported',
    result_in_freeze: i == 2,
    freeze_days: i == 2 ? 7 : nil
  )
end
puts "创建了 #{Violation.count} 条违规记录"

gates = ['东门', '西门', '南门', '北门']
actions = %w[in out]
results = %w[allowed allowed allowed allowed denied]

20.times do
  person = people.sample
  pass = person.passes.first
  result = results.sample

  GateLog.create!(
    pass: result == 'allowed' ? pass : nil,
    person: person,
    vehicle: pass&.vehicle,
    gate_name: gates.sample,
    action: actions.sample,
    logged_at: rand(24).hours.ago,
    operator: User.find_by(username: 'guard'),
    result: result,
    remark: result == 'denied' ? ['通行证过期', '无权限进入该区域', '证件核验失败'].sample : nil,
    temperature: result == 'allowed' ? "#{rand(360..370) / 10.0}" : nil,
    id_card_verified: result == 'allowed' ? '通过' : '未通过',
    photo_match_result: result == 'allowed' ? '匹配' : '不匹配'
  )
end
puts "创建了 #{GateLog.count} 条门岗记录"

Notification.create!(
  recipient: approver_user,
  title: '新通行证待审批',
  content: '有新的通行证申请等待您的审批',
  notification_type: 'approval_required',
  priority: 'high'
)

Notification.create!(
  recipient: safety_user,
  title: '新违规记录上报',
  content: '有新的违规记录需要处理',
  notification_type: 'violation_reported',
  priority: 'normal'
)
puts "创建了 #{Notification.count} 条通知"

puts "\n=== 测试账号汇总 ==="
puts "管理员: admin / 123456"
puts "安全员: safety / 123456"
puts "审批人: approver / 123456"
puts "门  岗: guard / 123456"
puts "员  工: staff / 123456"
puts "\n测试数据创建完成！"
