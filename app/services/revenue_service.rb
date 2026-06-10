class RevenueService
  def event_revenue(event)
    orders = event.ticket_types.joins(:orders).where(orders: { status: %w[paid] })
    { total: orders.sum("orders.total_amount"), count: orders.count }
  end

  def refund_rate(event)
    total = event.ticket_types.joins(:orders).where(orders: { status: %w[paid refunded] }).count
    refunded = event.ticket_types.joins(:orders).where(orders: { status: :refunded }).count
    return 0 if total.zero?
    (refunded.to_f / total * 100).round(2)
  end

  def daily_revenue(event, days: 30)
    event.ticket_types.joins(:orders)
      .where(orders: { status: %w[paid], paid_at: days.days.ago..Time.current })
      .group("DATE(orders.paid_at)")
      .sum("orders.total_amount")
  end

  def revenue_by_ticket_type(event)
    event.ticket_types.joins(:orders).where(orders: { status: %w[paid] })
      .group("ticket_types.name")
      .sum("orders.total_amount")
  end
end
