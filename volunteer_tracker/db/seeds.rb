admins = User.create!([
  { name: 'Admin One', email: 'admin1@example.com', password: 'password123', role: 'admin' },
  { name: 'Admin Two', email: 'admin2@example.com', password: 'password123', role: 'admin' }
])

volunteers = User.create!([
  { name: 'Volunteer Alice', email: 'alice@example.com', password: 'password123', role: 'volunteer', phone: '13800000001' },
  { name: 'Volunteer Bob', email: 'bob@example.com', password: 'password123', role: 'volunteer', phone: '13800000002' },
  { name: 'Volunteer Carol', email: 'carol@example.com', password: 'password123', role: 'volunteer', phone: '13800000003' },
  { name: 'Volunteer Dave', email: 'dave@example.com', password: 'password123', role: 'volunteer', phone: '13800000004' },
  { name: 'Volunteer Eve', email: 'eve@example.com', password: 'password123', role: 'volunteer', phone: '13800000005' }
])

shifts = Shift.create!([
  { title: 'Morning Food Drive', description: 'Distribute food packages', start_time: 2.days.from_now.beginning_of_day + 9.hours, end_time: 2.days.from_now.beginning_of_day + 13.hours, capacity: 10, status: 'open' },
  { title: 'Afternoon Tutoring', description: 'Tutor children at community center', start_time: 3.days.from_now.beginning_of_day + 14.hours, end_time: 3.days.from_now.beginning_of_day + 17.hours, capacity: 5, status: 'open' },
  { title: 'Elderly Visit Program', description: 'Visit elderly residents', start_time: 1.day.ago.beginning_of_day + 10.hours, end_time: 1.day.ago.beginning_of_day + 12.hours, capacity: 8, status: 'closed' },
  { title: 'Park Cleanup', description: 'Community park cleanup event', start_time: 5.days.ago.beginning_of_day + 8.hours, end_time: 5.days.ago.beginning_of_day + 12.hours, capacity: 15, status: 'completed' },
  { title: 'Hospital Support', description: 'Assist at local hospital', start_time: 4.days.from_now.beginning_of_day + 9.hours, end_time: 4.days.from_now.beginning_of_day + 16.hours, capacity: 6, status: 'open' }
])

ShiftEnrollment.create!([
  { user: volunteers[0], shift: shifts[0], status: 'enrolled' },
  { user: volunteers[1], shift: shifts[0], status: 'enrolled' },
  { user: volunteers[2], shift: shifts[1], status: 'enrolled' },
  { user: volunteers[0], shift: shifts[2], status: 'checked_in' },
  { user: volunteers[3], shift: shifts[2], status: 'absent' },
  { user: volunteers[4], shift: shifts[3], status: 'checked_in' },
  { user: volunteers[1], shift: shifts[3], status: 'checked_in' },
  { user: volunteers[2], shift: shifts[4], status: 'enrolled' }
])

materials = Material.create!([
  { name: 'Rice', category: 'Food', unit: 'kg', quantity: 5, threshold: 20 },
  { name: 'Face Masks', category: 'Medical', unit: 'pieces', quantity: 8, threshold: 50 },
  { name: 'Blankets', category: 'Clothing', unit: 'pieces', quantity: 30, threshold: 10 },
  { name: 'Notebooks', category: 'Education', unit: 'pieces', quantity: 3, threshold: 15 },
  { name: 'Cooking Oil', category: 'Food', unit: 'liters', quantity: 50, threshold: 20 }
])

MaterialTransaction.create!([
  { material: materials[0], transaction_type: 'in', quantity: 100, operator: admins[0], remark: 'Initial stock' },
  { material: materials[0], transaction_type: 'out', quantity: 95, operator: volunteers[0], recipient: 'Family A', remark: 'Food distribution' },
  { material: materials[1], transaction_type: 'in', quantity: 200, operator: admins[0], remark: 'Donation received' },
  { material: materials[1], transaction_type: 'out', quantity: 192, operator: volunteers[1], recipient: 'Community Center', remark: 'Mask distribution' },
  { material: materials[3], transaction_type: 'in', quantity: 50, operator: admins[1], remark: 'Purchase' },
  { material: materials[3], transaction_type: 'out', quantity: 47, operator: volunteers[2], recipient: 'School', remark: 'School supplies' },
  { material: materials[4], transaction_type: 'in', quantity: 80, operator: admins[0], remark: 'Supplier delivery' },
  { material: materials[4], transaction_type: 'out', quantity: 30, operator: volunteers[3], recipient: 'Shelter', remark: 'Kitchen supplies' }
])

donations = Donation.create!([
  { donor_name: 'Zhang Wei', donor_contact: '13900001111', amount: 5000.00, donation_type: 'money', material: materials[0], quantity: nil, status: 'pending', remark: 'Monthly donation' },
  { donor_name: 'Li Fang', donor_contact: '13900002222', amount: nil, donation_type: 'material', material: materials[1], quantity: 100, status: 'received', remark: 'Mask donation' },
  { donor_name: 'Wang Jun', donor_contact: '13900003333', amount: 2000.00, donation_type: 'money', material: materials[2], quantity: nil, status: 'confirmed', remark: 'One-time support' },
  { donor_name: 'Chen Ming', donor_contact: '13900004444', amount: nil, donation_type: 'material', material: materials[3], quantity: 50, status: 'pending', remark: 'Book donation' },
  { donor_name: 'Zhao Lei', donor_contact: '13900005555', amount: 10000.00, donation_type: 'money', material: materials[4], quantity: nil, status: 'rejected', remark: 'Incomplete info' }
])

visit_records = VisitRecord.create!([
  { volunteer: volunteers[0], visit_date: 5.days.ago, target_name: 'Grandpa Liu', target_address: '123 Care St', target_contact: '13800011111', purpose: 'Wellness check', status: 'completed', result: 'In good health', next_action: 'Follow up next month' },
  { volunteer: volunteers[1], visit_date: 3.days.ago, target_name: 'Auntie Wang', target_address: '456 Kind Ln', target_contact: '13800022222', purpose: 'Needs assessment', status: 'planned' },
  { volunteer: volunteers[2], visit_date: 2.days.ago, target_name: 'Mr. Zhang', target_address: '789 Hope Rd', target_contact: '13800033333', purpose: 'Benefit verification', status: 'planned' },
  { volunteer: volunteers[3], visit_date: Date.today, target_name: 'Ms. Li', target_address: '321 Grace Ave', target_contact: '13800044444', purpose: 'Home evaluation', status: 'planned' },
  { volunteer: volunteers[4], visit_date: 1.day.from_now, target_name: 'Grandma Chen', target_address: '654 Mercy Blvd', target_contact: '13800055555', purpose: 'Monthly check-in', status: 'planned' }
])

volunteer_services = VolunteerService.create!([
  { title: 'Community Health Monitoring', description: 'Regular health check visits for elderly', category: 'Healthcare', status: 'active', start_date: 1.month.ago, end_date: 6.months.from_now },
  { title: 'Youth Mentoring Program', description: 'One-on-one mentoring for at-risk youth', category: 'Education', status: 'draft', start_date: 2.weeks.from_now, end_date: 4.months.from_now },
  { title: 'Disaster Relief Support', description: 'Emergency response and relief distribution', category: 'Emergency', status: 'paused', start_date: 3.months.ago, end_date: nil }
])

VolunteerServiceAssignment.create!([
  { volunteer_service: volunteer_services[0], user: volunteers[0], role: 'coordinator' },
  { volunteer_service: volunteer_services[0], user: volunteers[1], role: 'member' },
  { volunteer_service: volunteer_services[0], user: volunteers[2], role: 'member' },
  { volunteer_service: volunteer_services[2], user: volunteers[3], role: 'coordinator' },
  { volunteer_service: volunteer_services[2], user: volunteers[4], role: 'member' }
])

TrackingReminder.create!([
  { trackable: visit_records[1], reminder_type: 'overdue_follow_up', reminder_date: Date.today + 3.days, message: 'Overdue follow-up required for visit to Auntie Wang', status: 'pending' },
  { trackable: visit_records[2], reminder_type: 'overdue_follow_up', reminder_date: Date.today + 3.days, message: 'Overdue follow-up required for visit to Mr. Zhang', status: 'pending' },
  { trackable: donations[0], reminder_type: 'donation_follow_up', reminder_date: Date.today, message: '捐赠 Zhang Wei 的记录待处理', status: 'pending' },
  { trackable: donations[3], reminder_type: 'donation_follow_up', reminder_date: Date.today + 1.day, message: '捐赠 Chen Ming 的记录待处理', status: 'pending' },
  { trackable: materials[0], reminder_type: 'low_stock', reminder_date: Date.today, message: "物资 Rice 库存不足，当前库存 5，低于阈值 20", status: 'pending' }
])
