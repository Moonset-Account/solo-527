
puts "=== 快速创建测试数据 ==="

admin = User.find_by(email: 'admin@example.com') || User.create!(
  email: 'admin@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: '系统管理员',
  phone: '13800138000',
  role: :admin,
  status: :active
)
admin.confirm unless admin.confirmed?
puts "1. 管理员账号: admin@example.com / password123"

captain = User.find_by(email: 'captain@example.com') || User.create!(
  email: 'captain@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: '张队长',
  phone: '13900139000',
  role: :captain,
  status: :active
)
captain.confirm unless captain.confirmed?
puts "2. 队长账号: captain@example.com / password123"

driver = User.find_by(email: 'driver@example.com') || User.create!(
  email: 'driver@example.com',
  password: 'password123',
  password_confirmation: 'password123',
  name: '李司机',
  phone: '13700137000',
  role: :driver,
  status: :active
)
driver.confirm unless driver.confirmed?
puts "3. 司机账号: driver@example.com / password123"

vehicles = []
if Vehicle.count < 3
  3.times do |i|
    vehicle = Vehicle.create!(
      plate_number: "京A#{10000 + i}",
      vehicle_type: i == 0 ? :refrigerated : :freezer,
      status: :active,
      min_temperature: i == 0 ? 2 : -18,
      max_temperature: i == 0 ? 8 : -10,
      current_driver: driver,
      last_temperature: i == 0 ? 5.0 : -15.0,
      last_temperature_at: Time.current,
      last_location_lat: 39.9042 + rand * 0.1,
      last_location_lng: 116.4074 + rand * 0.1,
      last_location_at: Time.current
    )
    vehicles << vehicle
    puts "4. 创建车辆: #{vehicle.plate_number} (#{vehicle.vehicle_type})"
  end
else
  vehicles = Vehicle.limit(3).to_a
  puts "4. 已有 #{Vehicle.count} 辆车辆"
end

if TemperatureRecord.count < 100
  vehicles.each do |vehicle|
    records = []
    48.times do |i|
      time = (48 - i).hours.ago
      temp = if vehicle.vehicle_type == 'refrigerated'
               5 + (rand - 0.5) * 3
             else
               -15 + (rand - 0.5) * 5
             end
      records << {
        vehicle_id: vehicle.id,
        temperature: temp.round(1),
        recorded_at: time,
        created_at: time,
        updated_at: time
      }
    end
    TemperatureRecord.insert_all(records)
    puts "5. 为 #{vehicle.plate_number} 创建了 #{records.size} 条温度记录"
  end
else
  puts "5. 已有 #{TemperatureRecord.count} 条温度记录"
end

if LocationRecord.count < 50
  vehicles.each do |vehicle|
    records = []
    24.times do |i|
      time = (24 - i).hours.ago
      lat = vehicle.last_location_lat + (rand - 0.5) * 0.05
      lng = vehicle.last_location_lng + (rand - 0.5) * 0.05
      records << {
        vehicle_id: vehicle.id,
        latitude: lat.round(6),
        longitude: lng.round(6),
        speed: rand(0..60).round(1),
        heading: rand(0..360).round(1),
        recorded_at: time,
        created_at: time,
        updated_at: time
      }
    end
    LocationRecord.insert_all(records)
    puts "6. 为 #{vehicle.plate_number} 创建了 #{records.size} 条位置记录"
  end
else
  puts "6. 已有 #{LocationRecord.count} 条位置记录"
end

puts ""
puts "=== 完成 ==="
puts "登录账号："
puts "  管理员: admin@example.com / password123"
puts "  队  长: captain@example.com / password123"
puts "  司  机: driver@example.com / password123"
