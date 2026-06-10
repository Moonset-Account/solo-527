require_relative 'config/environment'

puts '=== Model Statuses ==='
puts 'Ticket.statuses: ' + Ticket.statuses.keys.inspect
puts 'BatchOperation.statuses: ' + BatchOperation.statuses.keys.inspect

puts "\n=== Associations ==="
puts 'TicketType.reflections: ' + TicketType.reflections.keys.inspect

puts "\n=== Test OrderService ==="
order = Order.pending.first
if order
  svc = OrderService.new(User.find(order.user_id))
  svc.pay_order(order)
  puts 'Order status after pay: ' + order.reload.status
  puts 'Tickets status: ' + order.tickets.pluck(:status).inspect
end

puts "\n=== Test RevenueService ==="
event = Event.first
if event
  revenue = RevenueService.new.event_revenue(event)
  puts 'Revenue: ' + revenue.inspect
  refund_rate = RevenueService.new.refund_rate(event)
  puts 'Refund rate: ' + refund_rate.to_s
end

puts "\n=== Test BatchOperationService ==="
begin
  bo = BatchOperation.new(user: User.ops_staff.first, operation_type: 'approve', target_type: 'Registration', target_ids: [])
  puts 'Can set processing status: ' + bo.valid?.to_s
  bo.status = :processing
  puts 'Status value: ' + bo.status
rescue => e
  puts 'Error: ' + e.message
end

puts "\n=== Test SavedFilter ==="
filter = SavedFilter.first
puts 'SavedFilter exists: ' + (filter.present? ? 'yes' : 'no')
puts 'Filter conditions: ' + (filter&.conditions || '{}').to_s

puts "\n=== DONE ==="
