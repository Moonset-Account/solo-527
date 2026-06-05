zone = WorkZone.find(6)
puts "区域#{zone.id} #{zone.name} 最大容量: #{zone.max_capacity}"
puts "当前有效通行证数量: #{zone.passes.active.count}"
zone.passes.active.each do |pass|
  puts "  通行证#{pass.id}: #{pass.pass_number} 人员:#{pass.person.name} 状态:#{pass.status}"
end
