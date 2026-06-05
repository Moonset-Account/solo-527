
puts "=== 核心功能验证 ==="
puts ""

puts "1. 验证CheckIn模型 (无checked_in_by)"
check_in = CheckIn.new(
  registration: Registration.first,
  student: Student.first,
  session: Session.first,
  checked_in_at: Time.current,
  check_in_method: 'qr',
  status: 'confirmed'
)
valid = check_in.valid?
puts "   结果: #{valid ? '✅ 通过' : '❌ ' + check_in.errors.full_messages.join(', ')}"

puts ""
puts "2. 验证散客报名 (无school_id)"
reg = Registration.new(
  session: Session.first,
  registration_type: 'individual',
  student_count: 2,
  contact_name: '测试家长',
  contact_phone: '13800138000',
  contact_email: 'test@example.com'
)
valid = reg.valid?
puts "   结果: #{valid ? '✅ 通过' : '❌ ' + reg.errors.full_messages.join(', ')}"

puts ""
puts "3. 验证报名嵌套学生属性"
reg2 = Registration.new(
  session: Session.first,
  registration_type: 'individual',
  contact_name: '测试',
  contact_phone: '13800138000',
  contact_email: 'test@test.com',
  students_attributes: [
    { name: '学生1', gender: 'male', age_group: 'primary_1_2' }
  ]
)
valid = reg2.valid?
puts "   结果: #{valid ? '✅ 通过' : '❌ ' + reg2.errors.full_messages.join(', ')}"
puts "   学生数量: #{reg2.students.size}"

puts ""
puts "4. 枚举字段验证"
puts "   Registration.registration_types: #{Registration.registration_types.keys.inspect}"
puts "   CheckIn.statuses: #{CheckIn.statuses.keys.inspect}"

puts ""
puts "5. 模型关联验证"
puts "   Registration belongs_to user optional: #{Registration.reflect_on_association(:user).options[:optional]}"
puts "   Registration belongs_to school optional: #{Registration.reflect_on_association(:school).options[:optional]}"
puts "   CheckIn belongs_to checked_in_by optional: #{CheckIn.reflect_on_association(:checked_in_by).options[:optional]}"

puts ""
puts "=== 验证完成 ==="
