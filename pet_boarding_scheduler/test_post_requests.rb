require "net/http"
require "uri"
require "json"

def get_csrf_token(cookie)
  uri = URI("http://localhost:3000/admin/boarding_reservations")
  req = Net::HTTP::Get.new(uri)
  req["Cookie"] = cookie if cookie
  res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
  
  cookie = res.get_fields("set-cookie")&.join("; ") || cookie
  body = res.body
  
  # Extract CSRF token from meta tag
  token_match = body.match(/<meta name="csrf-token" content="([^"]+)"/)
  token = token_match ? token_match[1] : nil
  
  [token, cookie]
end

def post_request(path, token, cookie, data = {})
  uri = URI("http://localhost:3000#{path}")
  req = Net::HTTP::Post.new(uri)
  req["Cookie"] = cookie
  req["X-CSRF-Token"] = token
  req["Content-Type"] = "application/x-www-form-urlencoded"
  req["Accept"] = "text/vnd.turbo-stream.html, text/html"
  req.body = URI.encode_www_form(data) if data.any?
  
  res = Net::HTTP.start(uri.hostname, uri.port) { |http| http.request(req) }
  res
end

puts "=== 初始化会话 ==="
token, cookie = get_csrf_token(nil)
if token.nil?
  puts "✗ 无法获取CSRF Token"
  exit 1
end
puts "✓ CSRF Token: #{token[0..20]}..."
puts "✓ Cookie: #{cookie[0..40]}..."

puts ""
puts "=== 测试1: 页面HTTP状态 ==="
pages = [
  ["/", "首页"],
  ["/admin", "看板"],
  ["/admin/boarding_reservations", "寄养排班"],
  ["/admin/health_records", "健康记录"],
  ["/admin/training_records", "训练记录"],
  ["/admin/notifications", "通知中心"],
]
pages.each do |path, name|
  uri = URI("http://localhost:3000#{path}")
  res = Net::HTTP.get_response(uri)
  status = res.code == "200" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  #{name}"
end

puts ""
puts "=== 测试2: 通知标记已读(POST) ==="
# 先找一个未读通知
uri = URI("http://localhost:3000/admin/notifications")
res = Net::HTTP.get_response(uri)
if res.body =~ /href="\/admin\/notifications\/(\d+)"/
  notification_id = $1
  puts "找到通知ID: #{notification_id}"
  
  res = post_request("/admin/notifications/#{notification_id}/mark_as_read", token, cookie)
  status = res.code == "200" || res.code == "302" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  标记通知已读"
  puts "  响应内容类型: #{res.content_type}"
  puts "  响应头: #{res.to_hash.select { |k,v| k =~ /turbo|content-type/i }.inspect}"
else
  puts "\e[33m⚠️\e[0m  未找到通知，跳过"
end

puts ""
puts "=== 测试3: 全部标记已读(POST) ==="
res = post_request("/admin/notifications/mark_all_as_read", token, cookie)
status = res.code == "200" || res.code == "302" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
puts "#{status} #{res.code}  全部标记已读"

puts ""
puts "=== 测试4: 预约入住(POST) ==="
# 找一个scheduled状态的预约
res = Net::HTTP.get_response(URI("http://localhost:3000/admin/boarding_reservations"))
if res.body =~ /check_in_admin_boarding_reservation_path\(([^,\)]+)\)/ || 
   res.body =~ /\/admin\/boarding_reservations\/(\d+)\/check_in/
  reservation_id = $1.gsub(/[^0-9]/, '')
  puts "找到预约ID: #{reservation_id}"
  
  res = post_request("/admin/boarding_reservations/#{reservation_id}/check_in", token, cookie)
  status = res.code == "200" || res.code == "302" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  预约入住"
  puts "  响应内容类型: #{res.content_type}"
  if res.content_type&.include?("turbo-stream")
    puts "  ✅ Turbo Stream 响应正常"
    puts "  响应前200字符: #{res.body[0..200].gsub(/\n/, ' ')}"
  end
else
  puts "\e[33m⚠️\e[0m  未找到可入住的预约，跳过"
end

puts ""
puts "=== 测试5: 预约离店(POST) ==="
res = Net::HTTP.get_response(URI("http://localhost:3000/admin/boarding_reservations"))
if res.body =~ /check_out_admin_boarding_reservation_path\(([^,\)]+)\)/ ||
   res.body =~ /\/admin\/boarding_reservations\/(\d+)\/check_out/
  reservation_id = $1.gsub(/[^0-9]/, '')
  puts "找到入住中预约ID: #{reservation_id}"
  
  res = post_request("/admin/boarding_reservations/#{reservation_id}/check_out", token, cookie)
  status = res.code == "200" || res.code == "302" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  预约离店"
  puts "  响应内容类型: #{res.content_type}"
  if res.content_type&.include?("turbo-stream")
    puts "  ✅ Turbo Stream 响应正常"
  end
else
  puts "\e[33m⚠️\e[0m  未找到可离店的预约，跳过"
end

puts ""
puts "=== 测试完成 ==="
