person = Person.find(8)
puts "人员#{person.id} #{person.name} 的证件："
person.credentials.each do |c|
  puts "  #{c.credential_type_name} (#{c.credential_type}): 已核验=#{c.verified} 有效=#{c.currently_valid?}"
end

zone = WorkZone.find(6)
puts "\n区域#{zone.id} #{zone.name}："
puts "  类型: #{zone.zone_type_name} (#{zone.zone_type})"
puts "  危险区域: #{zone.dangerous?}"
puts "  需要二级审批: #{zone.requires_second_approval}"

work_zones = WorkZone.where(id: [6])
puts "\n工作区域集合: #{work_zones.pluck(:name)}"
puts "是否有危险区域: #{work_zones.exists?(zone_type: 'dangerous')}"

valid_credentials = person.credentials.valid
puts "\n人员有效证件数量: #{valid_credentials.count}"
has_special = valid_credentials.exists?(credential_type: %w[special_operation safety_certificate])
puts "是否有有效特种作业证: #{has_special}"
