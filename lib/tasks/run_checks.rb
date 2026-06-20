results = []
all_passed = true

def add_result(results, name, passed, actual: nil, expected: nil)
  status = passed ? '✅ PASS' : '❌ FAIL'
  message = "#{status} - #{name}"
  message += " | 实际: #{actual.inspect}" if actual
  message += " | 期望: #{expected.inspect}" if expected
  puts message
  results << { name: name, passed: passed, actual: actual, expected: expected }
  passed
end

puts "=" * 80
puts "开始执行系统健康检查"
puts "=" * 80
puts ""

puts "--- 1. 模型加载检查 ---"
begin
  ticket = Ticket.first
  passed = !ticket.nil?
  all_passed &= add_result(results, "Ticket.first 可正常加载", passed, actual: ticket&.title)
rescue => e
  all_passed &= add_result(results, "Ticket.first 可正常加载", false, actual: e.message)
end

puts ""
puts "--- 2. Ransack 白名单检查 ---"
begin
  attrs = Ticket.ransackable_attributes
  expected_attrs = %w[title description status priority department_id assignee_id submitter_id process_node deadline created_at completed_at]
  passed = (attrs.sort == expected_attrs.sort)
  all_passed &= add_result(results, "Ticket.ransackable_attributes 白名单正确", passed, actual: attrs, expected: expected_attrs)
rescue => e
  all_passed &= add_result(results, "Ticket.ransackable_attributes 白名单正确", false, actual: e.message)
end

puts ""
puts "--- 3. AuditLog 方法检查 ---"
begin
  audit_log = AuditLog.first
  method_exists = audit_log.respond_to?(:action_type_name)
  actual_name = audit_log&.action_type_name
  passed = method_exists && actual_name.present?
  all_passed &= add_result(results, "AuditLog.first&.action_type_name 方法存在且有返回值", passed, actual: actual_name)
rescue => e
  all_passed &= add_result(results, "AuditLog.first&.action_type_name 方法存在且有返回值", false, actual: e.message)
end

puts ""
puts "--- 4. 用户存在性检查 ---"
begin
  pm = User.find_by(email: 'pm@company.com')
  passed = !pm.nil?
  all_passed &= add_result(results, "User.find_by(email: 'pm@company.com') 存在", passed, actual: pm&.name)
rescue => e
  all_passed &= add_result(results, "User.find_by(email: 'pm@company.com') 存在", false, actual: e.message)
end

puts ""
puts "--- 5. Pundit 授权检查 ---"

puts "  5.1 pm (pm@company.com) 对 Department 的 index? 权限 (期望 false)"
begin
  pm = User.find_by(email: 'pm@company.com')
  result = Pundit.policy!(pm, Department).index?
  expected = false
  passed = (result == expected)
  all_passed &= add_result(results, "pm 对 Department.index?", passed, actual: result, expected: expected)
rescue => e
  all_passed &= add_result(results, "pm 对 Department.index?", false, actual: e.message, expected: false)
end

puts "  5.2 admin (admin@company.com) 对 Department 的 index? 权限 (期望 true)"
begin
  admin = User.find_by(email: 'admin@company.com')
  result = Pundit.policy!(admin, Department).index?
  expected = true
  passed = (result == expected)
  all_passed &= add_result(results, "admin 对 Department.index?", passed, actual: result, expected: expected)
rescue => e
  all_passed &= add_result(results, "admin 对 Department.index?", false, actual: e.message, expected: true)
end

puts "  5.3 pm (pm@company.com) 对 User 的 index? 权限 (期望 false)"
begin
  pm = User.find_by(email: 'pm@company.com')
  result = Pundit.policy!(pm, User).index?
  expected = false
  passed = (result == expected)
  all_passed &= add_result(results, "pm 对 User.index?", passed, actual: result, expected: expected)
rescue => e
  all_passed &= add_result(results, "pm 对 User.index?", false, actual: e.message, expected: false)
end

puts "  5.4 ceo (ceo@company.com) 对 User 的 index? 权限 (期望 true)"
begin
  ceo = User.find_by(email: 'ceo@company.com')
  result = Pundit.policy!(ceo, User).index?
  expected = true
  passed = (result == expected)
  all_passed &= add_result(results, "ceo 对 User.index?", passed, actual: result, expected: expected)
rescue => e
  all_passed &= add_result(results, "ceo 对 User.index?", false, actual: e.message, expected: true)
end

puts ""
puts "=" * 80
puts "检查汇总"
puts "=" * 80
puts ""
total = results.size
passed_count = results.count { |r| r[:passed] }
failed_count = total - passed_count
puts "总计: #{total} 项检查"
puts "通过: #{passed_count} 项"
puts "失败: #{failed_count} 项"
puts ""
if all_passed
  puts "🎉 所有检查均已通过！系统状态良好。"
else
  puts "⚠️  有 #{failed_count} 项检查未通过，请检查上方 ❌ FAIL 标记的项目。"
  puts ""
  puts "失败详情:"
  results.select { |r| !r[:passed] }.each do |r|
    puts "  - #{r[:name]}"
  end
end
puts ""
