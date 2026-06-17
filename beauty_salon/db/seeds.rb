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
