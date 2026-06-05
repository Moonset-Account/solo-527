zone = WorkZone.find(1)
puts "区域时段限制: #{zone.time_restrictions}"

valid_from = Time.parse("2026-06-05T10:00:00Z")
valid_until = Time.parse("2026-06-05T12:00:00Z")
puts "\n输入时间（UTC）:"
puts "  valid_from: #{valid_from} (#{valid_from.hour}时)"
puts "  valid_until: #{valid_until} (#{valid_until.hour}时)"

# 测试 parse_time_restrictions
restrictions = zone.time_restrictions
allowed_ranges = restrictions.scan(/(\d{1,2})[:：](\d{2})\s*[-~到]\s*(\d{1,2})[:：](\d{2})/).map do |start_h, start_m, end_h, end_m|
  [start_h.to_i, end_h.to_i]
end
puts "\n解析出的时段: #{allowed_ranges.inspect}"

# 测试 check_time_allowed
check_start = valid_from
check_end = valid_until
puts "\n检查时间段内的每个小时:"
(check_start.to_i..check_end.to_i).step(3600) do |time_i|
  time = Time.at(time_i)
  hour = time.hour
  allowed = allowed_ranges.any? { |start_h, end_h| hour >= start_h && hour < end_h }
  puts "  #{hour}时: #{allowed ? '允许' : '拒绝'}"
end
