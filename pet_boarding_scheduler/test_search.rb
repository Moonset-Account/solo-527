require "net/http"
require "uri"

tests = [
  ["/admin/training_records?q[pet_name_cont]=旺财", "训练记录-按宠物名搜索"],
  ["/admin/training_records?q[status_eq]=2", "训练记录-延期状态过滤"],
  ["/admin/health_records?q[pet_name_cont]=小", "健康记录-按宠物名搜索"],
  ["/admin/health_records?q[symptoms_present_eq]=1", "健康记录-有症状过滤"],
  ["/admin/boarding_reservations?q[pet_name_cont]=Bella", "寄养排班-宠物名搜索"],
  ["/admin/exports/boarding?async=true", "触发异步寄养导出"],
  ["/admin/exports/training?async=true", "触发异步训练导出"],
  ["/admin/exports/health?async=true", "触发异步健康导出"],
]
tests.each do |path, name|
  encoded_path = URI::DEFAULT_PARSER.escape(path)
  uri = URI("http://localhost:3000#{encoded_path}")
  res = Net::HTTP.get_response(uri)
  status = res.code == "200" || res.code == "302" ? "\e[32m✓\e[0m" : "\e[31m✗\e[0m"
  puts "#{status} #{res.code}  #{name}"
end
puts ""
puts "Sidekiq日志检查:"
`ls /Volumes/TraeProjects/trae-solo-generated-projects/work-0113/pet_boarding_scheduler/tmp/exports/ 2>/dev/null | head -10`.each_line { |l| puts "  文件: #{l}" }
puts "  (如果Sidekiq正在运行，应该1-2分钟后出现CSV文件)"
