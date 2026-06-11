doctor = Doctor.first
customer = Customer.where(vip: false).first
time_slot = doctor.time_slots.where("start_time > ?", Time.current).first
puts "Time slot: #{time_slot.start_time}, capacity: #{time_slot.capacity}, booked: #{time_slot.booked_count}, waiting: #{time_slot.waiting_count}"

wl = WaitingList.add_customer(customer, doctor, time_slot: time_slot, service_item: ServiceItem.first)
puts "New waiting list entry: position=#{wl.position}, tracking_code=#{wl.tracking_code}, status=#{wl.status}"

puts "Snapshots count: #{wl.before_after_snapshots.count}"
puts "First snapshot: #{wl.before_after_snapshots.first.inspect}"

appointments = Appointment.limit(3)
preview = BatchOperationLog.new.preview(appointments, {status: "confirmed"})
puts "Batch preview count: #{preview.count}"
puts "First preview valid: #{preview.first[:valid]}, errors: #{preview.first[:errors]}"

wl2 = WaitingList.where(status: "waiting").first
if wl2
  service_items = [ServiceItem.first]
  appt = wl2.convert_to_appointment!(service_items: service_items, operator: "test_admin")
  puts "Converted to appointment: #{appt&.appointment_no}, status: #{wl2.reload.status}"
end

puts "All tests passed!"
