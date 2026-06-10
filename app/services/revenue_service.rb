class RevenueService
  def event_revenue(event)
    orders = event_orders(event).where(status: %w[paid])
    { total: orders.sum("orders.total_amount"), count: orders.count }
  end

  def refund_rate(event)
    all = event_orders(event).where(status: %w[paid refunded]).count
    refunded = event_orders(event).where(status: :refunded).count
    return 0 if all.zero?
    (refunded.to_f / all * 100).round(2)
  end

  def daily_revenue(event, days: 30)
    event_orders(event)
      .where(status: %w[paid], paid_at: days.days.ago..Time.current)
      .group("DATE(orders.paid_at)")
      .sum("orders.total_amount")
  end

  def revenue_by_ticket_type(event)
    event_orders(event)
      .where(status: %w[paid])
      .joins(tickets: :ticket_type)
      .group("ticket_types.name")
      .sum("orders.total_amount")
  end

  private

  def event_orders(event)
    Order.joins(tickets: :ticket_type)
      .where(ticket_types: { event_id: event.id })
      .distinct
  end
end
