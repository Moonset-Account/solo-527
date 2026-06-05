zone = WorkZone.find(1)
puts "区域时段限制: #{zone.time_restrictions}"

# 测试北京时间 10:00-12:00 (对应的 UTC 是 02:00-04:00)
valid_from = Time.parse("2026-06-05T02:00:00Z")
valid_until = Time.parse("2026-06-05T04:00:00Z")
puts "\n测试1: 北京时间 10:00-12:00 (UTC 02:00-04:00)"
puts "  valid_from (local): #{valid_from.getlocal} (#{valid_from.getlocal.hour}时)"
puts "  valid_until (local): #{valid_until.getlocal} (#{valid_until.getlocal.hour}时)"

restrictions = zone.time_restrictions
allowed_ranges = restrictions.scan(/(\d{1,2})[:：](\d{2})\s*[-~到]\s*(\d{1,2})[:：](\d{2})/).map do |start_h, start_m, end_h, end_m|
  [start_h.to_i, end_h.to_i]
end
puts "  允许时段: #{allowed_ranges.inspect}"

all_allowed = true
(valid_from.to_i..valid_until.to_i).step(3600) do |time_i|
  time = Time.at(time_i).getlocal
  hour = time.hour
  allowed = allowed_ranges.any? { |start_h, end_h| hour >= start_h && hour < end_h }
  puts "    #{hour}时: #{allowed ? '允许' : '拒绝'}"
  all_allowed = false unless allowed
end
puts "  结果: #{all_allowed ? '通过' : '拒绝'}"

# 测试北京时间 20:00-22:00 (对应的 UTC 是 12:00-14:00)
puts "\n测试2: 北京时间 20:00-22:00 (UTC 12:00-14:00)"
valid_from2 = Time.parse("2026-06-05T12:00:00Z")
valid_until2 = Time.parse("2026-06-05T14:00:00Z")
puts "  valid_from (local): #{valid_from2.getlocal} (#{valid_from2.getlocal.hour}时)"
puts "  valid_until (local): #{valid_until2.getlocal} (#{valid_until2.getlocal.hour}时)"

all_allowed2 = true
(valid_from2.to_i..valid_until2.to_i).step(3600) do |time_i|
  time = Time.at(time_i).getlocal
  hour = time.hour
  allowed = allowed_ranges.any? { |start_h, end_h| hour >= start_h && hour < end_h }
  puts "    #{hour}时: #{allowed ? '允许' : '拒绝'}"
  all_allowed2 = false unless allowed
end
puts "  结果: #{all_allowed2 ? '通过' : '拒绝'}"
