class AnomalyDetector
  REFUND_RATE_THRESHOLD = 30.0
  SINGLE_REFUND_THRESHOLD = 10_000

  def check_event(event)
    anomalies = []
    refund_rate = RevenueService.new.refund_rate(event)

    event_orders = Order.joins(tickets: :ticket_type)
      .where(ticket_types: { event_id: event.id })
      .distinct

    refunded_orders = event_orders.where(status: :refunded)
    largest_refund_order = refunded_orders.order(total_amount: :desc).first

    if refund_rate > REFUND_RATE_THRESHOLD && largest_refund_order
      total_refund_amount = refunded_orders.sum(:total_amount)
      anomalies << create_anomaly(
        event,
        "high_refund",
        "退票率异常: #{refund_rate}%, 涉及#{refunded_orders.count}笔订单, 主责订单:#{largest_refund_order.order_no}",
        order: largest_refund_order,
        amount: total_refund_amount
      )
    end

    refunded_orders.each do |order|
      if order.total_amount >= SINGLE_REFUND_THRESHOLD
        anomalies << create_anomaly(event, "unusual_amount", "单笔大额退款: ¥#{order.total_amount}", order: order)
      end
    end

    check_frequency_spike(event, event_orders, refunded_orders, anomalies)
    anomalies
  end

  private

  def check_frequency_spike(event, event_orders, refunded_orders, anomalies)
    today_refunds = refunded_orders.where(updated_at: Time.current.all_day)
    today_count = today_refunds.count
    seven_day_count = refunded_orders.where(updated_at: 7.days.ago..Time.current).count
    avg_count = seven_day_count / 7.0
    if avg_count > 0 && today_count > avg_count * 3
      largest_today_order = today_refunds.order(total_amount: :desc).first
      if largest_today_order
        today_amount = today_refunds.sum(:total_amount)
        anomalies << create_anomaly(
          event,
          "frequency_spike",
          "退款频率异常: 今日#{today_count}笔, 周均#{avg_count.round(1)}笔, 主责订单:#{largest_today_order.order_no}",
          order: largest_today_order,
          amount: today_amount
        )
      end
    end
  end

  def create_anomaly(event, type, description, order:, amount: nil)
    anomaly_amount = amount || order.total_amount
    RevenueAnomaly.create!(
      event: event,
      order: order,
      user: order.user,
      anomaly_type: type,
      amount: anomaly_amount,
      description: description,
      status: :open,
      detected_at: Time.current
    )
  end
end
