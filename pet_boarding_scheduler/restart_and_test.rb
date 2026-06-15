#!/usr/bin/env ruby
# restart_and_test.rb
require "fileutils"

pid_file = "/Volumes/TraeProjects/trae-solo-generated-projects/work-0113/pet_boarding_scheduler/tmp/pids/server.pid"
old_pid = File.read(pid_file).strip rescue nil

if old_pid && !old_pid.empty?
  begin
    Process.kill("TERM", old_pid.to_i)
    puts "Killed old server PID #{old_pid}"
    sleep 3
  rescue => e
    puts "Kill issue: #{e.message}"
  end
end

# cleanup
FileUtils.rm_f(pid_file)
FileUtils.rm_f(Dir.glob("/Volumes/TraeProjects/trae-solo-generated-projects/work-0113/pet_boarding_scheduler/tmp/pids/*.pid"))

Dir.chdir("/Volumes/TraeProjects/trae-solo-generated-projects/work-0113/pet_boarding_scheduler")

# Start in background
server_pid = Process.spawn({}, "bin/rails s -p 3000 -P tmp/pids/server.pid 2>&1 > /tmp/rails_server_3000.log", pgroup: true)
Process.detach(server_pid)
puts "Started server PID #{server_pid}, waiting..."

# Wait up to 30 seconds for server
30.times do |i|
  sleep 1
  begin
    require "net/http"
    res = Net::HTTP.get_response(URI("http://localhost:3000/"))
    if res.code == "200" || res.code == "500"
      puts "Server responded after #{i+1}s: HTTP #{res.code}"
      break
    end
  rescue Errno::ECONNREFUSED
    print "."
    STDOUT.flush
  end
end

puts "\nNow running tests..."
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

ok = 0
fail = 0
tests.each do |path, name|
  uri = URI("http://localhost:3000#{path}")
  res = Net::HTTP.get_response(uri)
  if res.code == "200"
    status = "\e[32m✓\e[0m"
    ok += 1
  else
    status = "\e[31m✗\e[0m"
    fail += 1
  end
  puts "#{status} #{res.code}  #{name}"
end

puts ""
puts "=" * 50
puts "总计: #{tests.size}  成功: #{ok}  失败: #{fail}"
puts "完成时间: #{Time.now}"
