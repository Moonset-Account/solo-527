require_relative 'config/environment'

puts '=== 1. 退票申请参数链路验证 ==='
user = User.find_by(role: :organizer)
order = user.orders.paid.first
puts "用户: #{user.name}, 订单: #{order&.order_no}"

# 测试 RefundService 带金额
service = RefundService.new(user)
refund = service.create_refund(order, reason: "测试退票", amount: (order.total_amount * 0.5).to_s)
puts "RefundService create_refund(带金额): id=#{refund.id}, amount=#{refund.amount}, user=#{refund.user.name}, order=#{refund.order.order_no}"

# 清理测试数据
refund.destroy
puts "测试退票已清理"

# 测试 RefundService 不带金额（默认订单金额）
refund2 = service.create_refund(order, reason: "测试全额退票")
puts "RefundService create_refund(默认金额): id=#{refund2.id}, amount=#{refund2.amount}"
refund2.destroy

puts "\n=== 2. 收入异常检测验证 ==="
event = Event.first
puts "演出: #{event.title}"

detector = AnomalyDetector.new
anomalies = detector.check_event(event)
puts "生成异常数: #{anomalies.size}"
anomalies.each do |a|
  puts "  [#{a.anomaly_type}] 金额=#{a.amount}, order_id=#{a.order_id.inspect}, user_id=#{a.user_id.inspect}, 描述=#{a.description[0..30]}"
end

puts "\n=== 3. RevenueAnomaly 模型验证 ==="
anomalies.each do |a|
  puts "  #{a.anomaly_type}: valid?=#{a.valid?}, errors=#{a.errors.full_messages.join(', ')}"
end

# 清理生成的异常
anomalies.each { |a| a.destroy }

puts "\n=== DONE ==="
