require 'securerandom'

CHINESE_SURNAMES = %w[王 李 张 刘 陈 杨 黄 赵 周 吴 徐 孙 马 朱 胡 郭 何 高 林 罗]
CHINESE_GIVEN_NAMES = %w[伟 芳 娜 敏 静 丽 强 磊 军 洋 勇 艳 杰 涛 明 超 秀 霞 平 刚]
VEHICLE_MODELS = {
  refrigerated: ['福田欧马可冷藏车', '东风天锦冷藏车', '解放J6L冷藏车', '重汽豪沃冷藏车'],
  freezer: ['福田欧马可冷冻车', '东风天龙冷冻车', '解放J7冷冻车', '陕汽德龙冷冻车'],
  normal: ['福田欧航普通货车', '东风多利卡普通货车']
}
CLAIM_REASONS = {
  temperature: ['运输途中温度超标导致货物变质', '冷机故障导致温度失控', '装卸货时间过长温度回升'],
  delay: ['交通拥堵导致配送延迟', '车辆故障导致延误', '天气原因导致晚点'],
  damage: ['货物包装破损', '装卸不当导致损坏', '交通事故导致货损'],
  other: ['客户特殊要求赔付', '单证错误导致损失', '其他原因']
}
OPERATION_TYPES = %w[login logout create_claim update_claim approve_claim reject_claim
                     create_settlement approve_settlement pay_settlement
                     assign_driver reassign_driver create_vehicle update_vehicle
                     create_user update_user handle_alert resolve_alert]
REASSIGN_REASONS = ['司机请假', '车辆保养', '紧急任务调派', '司机离职', '线路调整']

def random_chinese_name
  CHINESE_SURNAMES.sample + CHINESE_GIVEN_NAMES.sample(rand(1..2)).join
end

def random_plate_number
  "京A#{rand(10000..99999)}"
end

ActiveRecord::Base.transaction do
  puts "=== 开始创建种子数据 ==="

  puts "1. 创建用户..."
  admin = User.create!(
    email: 'admin@example.com',
    password: 'password123',
    password_confirmation: 'password123',
    name: '系统管理员',
    role: :admin,
    status: :active,
    confirmed_at: Time.current
  )

  captains = []
  2.times do |i|
    captains << User.create!(
      email: "captain#{i + 1}@example.com",
      password: 'password123',
      password_confirmation: 'password123',
      name: "队长#{i + 1}",
      role: :captain,
      status: :active,
      confirmed_at: Time.current
    )
  end

  drivers = []
  5.times do |i|
    drivers << User.create!(
      email: "driver#{i + 1}@example.com",
      password: 'password123',
      password_confirmation: 'password123',
      name: random_chinese_name,
      role: :driver,
      status: :active,
      confirmed_at: Time.current
    )
  end
  puts "   创建了 1 个管理员, 2 个队长, 5 个司机"

  puts "2. 创建车辆..."
  vehicles = []
  plate_numbers = []

  5.times do
    plate = random_plate_number
    redo if plate_numbers.include?(plate)
    plate_numbers << plate

    vehicle = Vehicle.create!(
      plate_number: plate,
      vehicle_type: :refrigerated,
      model: VEHICLE_MODELS[:refrigerated].sample,
      capacity: rand(5.0..20.0).round(1),
      status: :active,
      min_temperature: 0,
      max_temperature: 8,
      current_driver: drivers.sample
    )
    vehicles << vehicle
  end

  3.times do
    plate = random_plate_number
    redo if plate_numbers.include?(plate)
    plate_numbers << plate

    vehicle = Vehicle.create!(
      plate_number: plate,
      vehicle_type: :freezer,
      model: VEHICLE_MODELS[:freezer].sample,
      capacity: rand(5.0..18.0).round(1),
      status: :active,
      min_temperature: -25,
      max_temperature: -15,
      current_driver: drivers.sample
    )
    vehicles << vehicle
  end
  puts "   创建了 8 辆冷链车 (5 辆冷藏车, 3 辆冷冻车)"

  puts "3. 生成温度记录 (最近7天, 每30分钟一条)..."
  total_temp_records = 0
  vehicles.each do |vehicle|
    count = SimulationService.generate_temperature_records(vehicle, 7)
    total_temp_records += count
  end
  puts "   生成了 #{total_temp_records} 条温度记录"

  puts "4. 生成位置记录 (最近7天, 每小时一条)..."
  total_loc_records = 0
  vehicles.each do |vehicle|
    count = SimulationService.generate_location_records(vehicle, 7)
    total_loc_records += count
  end
  puts "   生成了 #{total_loc_records} 条位置记录"

  puts "5. 生成温度告警 (最近7天)..."
  total_alerts = 0
  vehicles.each do |vehicle|
    count = SimulationService.generate_temperature_alerts(vehicle, 7)
    total_alerts += count
  end
  puts "   生成了 #{total_alerts} 条温度告警"

  puts "6. 创建结算单..."
  settlements = []
  5.times do |i|
    vehicle = vehicles[i % vehicles.size]
    driver = vehicle.current_driver || drivers.sample
    start_date = (30 - i * 5).days.ago.to_date
    end_date = start_date + 6.days

    statuses = [:draft, :pending, :approved, :paid, :approved]
    status = statuses[i]

    base_fee = rand(3000..8000).round(2)
    bonus_amount = rand(0..500).round(2)
    deduction_amount = rand(0..300).round(2)
    total_amount = base_fee + bonus_amount - deduction_amount

    settlement = Settlement.create!(
      settlement_no: "ST#{start_date.strftime('%Y%m%d')}#{format('%04d', i + 1)}",
      vehicle: vehicle,
      driver: driver,
      captain: captains.sample,
      start_date: start_date,
      end_date: end_date,
      total_mileage: rand(1000..3000).round(1),
      total_hours: rand(50..120).round(1),
      base_fee: base_fee,
      bonus_amount: bonus_amount,
      deduction_amount: deduction_amount,
      total_amount: total_amount.round(2),
      status: status,
      remark: status == :draft ? "待完善" : nil
    )
    settlements << settlement
  end
  puts "   创建了 #{settlements.size} 个结算单"

  puts "7. 创建赔付工单..."
  claims = []
  10.times do |i|
    vehicle = vehicles[i % vehicles.size]
    driver = vehicle.current_driver || drivers.sample
    claim_type = [:temperature, :delay, :damage, :other].sample
    statuses = [:pending, :processing, :approved, :rejected, :approved, :pending, :processing, :rejected, :approved, :pending]
    status = statuses[i]

    amount = case claim_type
             when :temperature then rand(500..3000).round(2)
             when :delay then rand(200..1000).round(2)
             when :damage then rand(1000..5000).round(2)
             else rand(100..2000).round(2)
             end

    reported_at = (25 - i * 2).days.ago + rand(0..23).hours
    handler = status != :pending ? [admin, captains.sample].flatten.sample : nil
    handled_at = handler ? reported_at + rand(1..24).hours : nil

    settlement = if status == :approved && i.even?
                   settlements.select { |s| s.status == :paid || s.status == :approved }.sample
                 end

    claim = Claim.create!(
      claim_no: "CL#{reported_at.strftime('%Y%m%d')}#{format('%04d', i + 1)}",
      vehicle: vehicle,
      driver: driver,
      settlement: settlement,
      claim_type: claim_type,
      amount: amount,
      status: status,
      description: CLAIM_REASONS[claim_type].sample,
      handler: handler,
      handled_at: handled_at,
      handle_result: handler ? (status == :approved ? "经核实情况属实，予以赔付" : "经核查不符合赔付条件，予以驳回") : nil,
      reported_at: reported_at,
      reported_by_id: driver.id
    )
    claims << claim
  end
  puts "   创建了 #{claims.size} 个赔付工单"

  puts "8. 创建司机改派记录..."
  driver_assignments = []
  4.times do |i|
    vehicle = vehicles[i]
    old_driver = drivers[i % drivers.size]
    new_driver = drivers[(i + 1) % drivers.size]
    reassigned_at = (20 - i * 5).days.ago + rand(8..18).hours
    processing_duration = rand(30..120).minutes

    assignment = DriverAssignment.create!(
      vehicle: vehicle,
      old_driver: old_driver,
      new_driver: new_driver,
      reassigned_by: [admin, captains.sample].flatten.sample,
      reason: REASSIGN_REASONS.sample,
      reassigned_at: reassigned_at,
      remark: "因#{REASSIGN_REASONS.sample}，需临时调整司机",
      processing_duration_seconds: processing_duration.to_i
    )
    driver_assignments << assignment

    if i == 0
      vehicle.update!(current_driver: new_driver)
    end
  end
  puts "   创建了 #{driver_assignments.size} 条司机改派记录"

  puts "9. 创建操作记录 (最近30天)..."
  all_users = [admin] + captains + drivers
  total_op_logs = 0

  300.times do
    user = all_users.sample
    action = OPERATION_TYPES.sample
    created_at = rand(1..30).days.ago + rand(0..23).hours + rand(0..59).minutes

    target = case action
             when /claim/ then claims.sample
             when /settlement/ then settlements.sample
             when /vehicle/ then vehicles.sample
             when /user/ then drivers.sample
             when /driver/ then driver_assignments.sample
             when /alert/ then TemperatureAlert.all.sample
             else nil
             end

    details = case action
              when 'login' then { ip: "192.168.#{rand(1..255)}.#{rand(1..255)}", user_agent: 'Chrome/120.0' }
              when 'create_claim' then { claim_no: claims.sample&.claim_no, amount: rand(100..5000) }
              when 'approve_claim' then { claim_no: claims.sample&.claim_no, approved_amount: rand(100..5000) }
              when 'assign_driver' then { vehicle_id: vehicles.sample&.id, driver_id: drivers.sample&.id }
              when 'resolve_alert' then { alert_id: TemperatureAlert.all.sample&.id, note: '已检查冷机设备，恢复正常' }
              else {}
              end

    OperationLog.create!(
      user: user,
      action: action,
      target: target,
      details: details,
      created_at: created_at,
      updated_at: created_at
    )
    total_op_logs += 1
  end
  puts "   创建了 #{total_op_logs} 条操作记录"

  puts "=== 种子数据创建完成 ==="
  puts ""
  puts "登录信息："
  puts "  管理员: admin@example.com / password123"
  puts "  队长: captain1@example.com / password123"
  puts "  司机: driver1@example.com / password123"
end
