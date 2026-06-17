Customer.find_or_create_by!(phone: "13800000001") { |c| c.name = "张三"; c.notes = "VIP客户" }
Customer.find_or_create_by!(phone: "13800000002") { |c| c.name = "李四" }
Customer.find_or_create_by!(phone: "13800000003") { |c| c.name = "王五" }

Technician.find_or_create_by!(phone: "15900000001") { |t| t.name = "小红"; t.specialty = "面部护理"; t.active = true }
Technician.find_or_create_by!(phone: "15900000002") { |t| t.name = "小丽"; t.specialty = "身体护理"; t.active = true }
Technician.find_or_create_by!(phone: "15900000003") { |t| t.name = "小美"; t.specialty = "美甲"; t.active = true }

Treatment.find_or_create_by!(name: "基础面部护理") { |t| t.category = "facial"; t.price = 298; t.duration = 60; t.description = "深层清洁+补水保湿"; t.active = true }
Treatment.find_or_create_by!(name: "精华面部护理") { |t| t.category = "facial"; t.price = 598; t.duration = 90; t.description = "精华导入+紧致提拉"; t.active = true }
Treatment.find_or_create_by!(name: "全身SPA") { |t| t.category = "body"; t.price = 698; t.duration = 120; t.description = "全身精油按摩+芳香疗法"; t.active = true }
Treatment.find_or_create_by!(name: "肩颈疏通") { |t| t.category = "body"; t.price = 398; t.duration = 60; t.description = "肩颈经络疏通+热敷"; t.active = true }
Treatment.find_or_create_by!(name: "日式美甲") { |t| t.category = "nail"; t.price = 198; t.duration = 45; t.description = "日式精致美甲"; t.active = true }

customer1 = Customer.find_by(phone: "13800000001")
customer2 = Customer.find_by(phone: "13800000002")

facial_treatment = Treatment.find_by(name: "基础面部护理")
essence_treatment = Treatment.find_by(name: "精华面部护理")
spa_treatment = Treatment.find_by(name: "全身SPA")

if customer1 && facial_treatment
  card1 = TreatmentCard.find_or_create_by!(card_number: "VIP001") do |c|
    c.customer = customer1
    c.total_amount = 3000
    c.remaining_amount = 3000
    c.status = :active
    c.purchased_at = 30.days.ago
    c.expired_at = 1.year.from_now
  end
  if card1.treatment_card_items.empty?
    TreatmentCardItem.create!(treatment_card: card1, treatment: facial_treatment, total_sessions: 10, remaining_sessions: 7)
    TreatmentCardItem.create!(treatment_card: card1, treatment: essence_treatment, total_sessions: 5, remaining_sessions: 3)
  end

  card2 = TreatmentCard.find_or_create_by!(card_number: "VIP002") do |c|
    c.customer = customer1
    c.total_amount = 2000
    c.remaining_amount = 2000
    c.status = :active
    c.purchased_at = 10.days.ago
    c.expired_at = 6.months.from_now
  end
  if card2.treatment_card_items.empty?
    TreatmentCardItem.create!(treatment_card: card2, treatment: spa_treatment, total_sessions: 5, remaining_sessions: 1)
  end
end

if customer2 && facial_treatment
  card3 = TreatmentCard.find_or_create_by!(card_number: "VIP003") do |c|
    c.customer = customer2
    c.total_amount = 1500
    c.remaining_amount = 1500
    c.status = :active
    c.purchased_at = 5.days.ago
    c.expired_at = 1.year.from_now
  end
  if card3.treatment_card_items.empty?
    TreatmentCardItem.create!(treatment_card: card3, treatment: facial_treatment, total_sessions: 5, remaining_sessions: 5)
  end
end

ConsumableRule.find_or_create_by!(name: "面部护理低次数提醒", treatment: facial_treatment) do |r|
  r.threshold_sessions = 2
  r.threshold_percentage = 30
  r.check_interval = 4
  r.active = true
end

ConsumableRule.find_or_create_by!(name: "SPA低次数提醒", treatment: spa_treatment) do |r|
  r.threshold_sessions = 1
  r.threshold_percentage = nil
  r.check_interval = 4
  r.active = true
end

puts "Seed data loaded successfully!"
puts "Customer 1 (张三) phone: #{customer1.id} - view at /external/customers/#{customer1.id}/treatment_cards"
puts "Customer 2 (李四) phone: #{customer2.id} - view at /external/customers/#{customer2.id}/treatment_cards"

