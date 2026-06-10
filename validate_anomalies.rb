require_relative 'config/environment'

puts '=== 收入异常类型保存验证 ==='
event = Event.first

# 1. 测试 high_refund（无 order，有金额）
anomaly1 = RevenueAnomaly.create!(
  event: event,
  anomaly_type: "high_refund",
  amount: 5000.0,
  description: "退票率异常: 45%",
  status: :open,
  detected_at: Time.current
)
puts "1. high_refund: valid?=#{anomaly1.valid?}, id=#{anomaly1.id}, amount=#{anomaly1.amount}, order_id=#{anomaly1.order_id.inspect}, user_id=#{anomaly1.user_id.inspect}"

# 2. 测试 frequency_spike（无 order，有金额）
anomaly2 = RevenueAnomaly.create!(
  event: event,
  anomaly_type: "frequency_spike",
  amount: 8000.0,
  description: "退款频率异常: 今日10笔, 周均2.5笔",
  status: :open,
  detected_at: Time.current
)
puts "2. frequency_spike: valid?=#{anomaly2.valid?}, id=#{anomaly2.id}, amount=#{anomaly2.amount}"

# 3. 测试 unusual_amount（有 order，有用户）
order = Order.find_by(status: :refunded) || Order.first
anomaly3 = RevenueAnomaly.create!(
  event: event,
  order: order,
  user: order.user,
  anomaly_type: "unusual_amount",
  amount: order.total_amount,
  description: "单笔大额退款: ¥#{order.total_amount}",
  status: :open,
  detected_at: Time.current
)
puts "3. unusual_amount: valid?=#{anomaly3.valid?}, id=#{anomaly3.id}, order_no=#{anomaly3.order&.order_no}, user=#{anomaly3.user&.name}"

# 4. 测试视图渲染不会报错
puts "\n=== 视图变量验证 ==="
@revenue_anomalies = RevenueAnomaly.where(id: [anomaly1.id, anomaly2.id, anomaly3.id])
puts "异常列表数量: #{@revenue_anomalies.count}"

@revenue_anomalies.each do |a|
  order_no = a.order&.order_no || '-'
  user_name = a.user&.name || '-'
  puts "  [#{a.anomaly_type}] 订单=#{order_no}, 用户=#{user_name}, 金额=#{a.amount}"
end

# 清理
anomaly1.destroy
anomaly2.destroy
anomaly3.destroy
puts "\n测试数据已清理"

puts "\n=== DONE ==="
