require "net/http"
tests = [
  ["/", "首页"],
  ["/admin", "看板"],
  ["/pets", "宠物列表"],
  ["/pets/1", "宠物详情"],
  ["/admin/pets", "管理宠物"],
  ["/admin/pets/1", "宠物管理详情"],
  ["/admin/boarding_reservations", "寄养排班"],
  ["/admin/health_records", "健康记录"],
  ["/admin/training_records", "训练记录"],
  ["/admin/safety_incidents", "安全事件"],
  ["/admin/notifications", "通知中心"],
  ["/admin/analytics/service_quality", "服务质量"],
  ["/admin/analytics/safety_trends", "安全趋势"],
  ["/admin/analytics/training_delays", "训练延期"],
  ["/admin/services", "服务设置"],
  ["/admin/caretakers", "主理人管理"],
  ["/admin/kennels", "笼位管理"],
  ["/pets/new", "新增宠物前台"],
]
tests.each do |path, name|
  uri = URI("http://localhost:3000#{path}")
  res = Net::HTTP.get_response(uri)
  status = res.code == "200" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  #{name}"
end
puts ""
puts "测试完成时间: #{Time.now}"
