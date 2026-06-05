expired_passes = Pass.where('valid_until <= ?', Time.current).where(is_frozen: false)
puts "过期且未冻结的通行证: #{expired_passes.count}"
expired_passes.each do |p|
  puts "  ID:#{p.id} #{p.pass_number} 状态:#{p.status} 过期时间:#{p.valid_until}"
end

puts "\nExpireCheckJob 查询条件是 status = 'approved'"
approved_expired = Pass.where(status: 'approved').where('valid_until <= ?', Time.current).where(is_frozen: false)
puts "已批准且过期且未冻结: #{approved_expired.count}"

puts "\n手动创建一个已批准的过期通行证来测试..."
test_pass = Pass.find_by(status: 'pending', is_frozen: false)
if test_pass
  test_pass.update!(status: 'approved', valid_until: 1.day.ago)
  puts "  已将通行证 #{test_pass.id} 设置为已批准且过期"
end

puts "\n再次运行 ExpireCheckJob..."
ExpireCheckJob.perform_now

puts "\n检查结果:"
approved_expired = Pass.where(status: 'approved').where('valid_until <= ?', Time.current).where(is_frozen: false)
puts "已批准且过期且未冻结: #{approved_expired.count}"
frozen_expired = Pass.where(status: 'approved').where('valid_until <= ?', Time.current).where(is_frozen: true)
puts "已批准且过期且已冻结: #{frozen_expired.count}"
