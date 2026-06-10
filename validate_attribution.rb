require_relative 'config/environment'

puts '=== 收入异常责任人归因完整验证 ==='
event = Event.first
puts "演出: #{event.title}"

# 先准备一些 refunded 订单用于验证
orders = Order.joins(tickets: :ticket_type).where(ticket_types: { event_id: event.id }).distinct
puts "该演出订单总数: #{orders.count}"
puts "已退款订单数: #{orders.where(status: :refunded).count}"

# 如果退款订单太少，先人工造一些退款订单来触发阈值
refunded_count = orders.where(status: :refunded).count
if refunded_count < 3
  puts "\n需要构造更多退款订单来触发阈值..."
  paid_orders = orders.where(status: :paid).limit(3 - refunded_count)
  paid_orders.each do |o|
    o.update!(status: :refunded)
    puts "  已把订单 #{o.order_no} 改为 refunded"
  end
end

puts "\n=== 运行 AnomalyDetector ==="
detector = AnomalyDetector.new
anomalies = detector.check_event(event)
puts "生成异常数: #{anomalies.size}"

anomalies.each do |a|
  puts "\n  [#{a.anomaly_type}]"
  puts "    有效: #{a.valid?}, 错误: #{a.errors.full_messages.join(', ')}"
  puts "    订单ID: #{a.order_id} (#{a.order.order_no})"
  puts "    用户ID: #{a.user_id} (#{a.user.name})"
  puts "    金额: #{a.amount}"
  puts "    描述: #{a.description}"
end

puts "\n=== 模拟视图渲染访问 ==="
anomalies.each do |a|
  begin
    order_no = a.order.order_no
    user_name = a.user.name
    amount = a.amount
    puts "  [#{a.anomaly_type}] 订单=#{order_no}, 用户=#{user_name}, 金额=#{amount} OK"
  rescue => e
    puts "  [#{a.anomaly_type}] 错误: #{e.class}: #{e.message}"
  end
end

# 清理生成的异常
anomalies.each { |a| a.destroy }
puts "\n已清理测试数据"

puts "\n=== DONE ==="
