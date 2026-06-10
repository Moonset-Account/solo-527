class AnomalyDetector
  REFUND_RATE_THRESHOLD = 30.0
  SINGLE_REFUND_THRESHOLD = 10_000

  def check_event(event)
    anomalies = []
    refund_rate = RevenueService.new.refund_rate(event)
    if refund_rate > REFUND_RATE_THRESHOLD
      anomalies << create_anomaly(event, "high_refund", "退票率异常: #{refund_rate}%")
    end

    event_orders = Order.joins(tickets: :ticket_type)
      .where(ticket_types: { event_id: event.id })
      .distinct

    refunded_orders = event_orders.where(status: :refunded)
    refunded_orders.each do |order|
      if order.total_amount >= SINGLE_REFUND_THRESHOLD
        anomalies << create_anomaly(event, "unusual_amount", "单笔大额退款: ¥#{order.total_amount}", order)
      end
    end

    check_frequency_spike(event, event_orders, anomalies)
    anomalies
  end

  private

  def check_frequency_spike(event, event_orders, anomalies)
    today_count = event_orders.where(status: :refunded, updated_at: Time.current.all_day).count
    seven_day_count = event_orders.where(status: :refunded, updated_at: 7.days.ago..Time.current).count
    avg_count = seven_day_count / 7.0
    if avg_count > 0 && today_count > avg_count * 3
      anomalies << create_anomaly(event, "frequency_spike", "退款频率异常: 今日#{today_count}笔, 周均#{avg_count.round(1)}笔")
    end
  end

  def create_anomaly(event, type, description, order = nil)
    RevenueAnomaly.create!(
      event: event,
      order: order,
      user: order&.user,
      anomaly_type: type,
      amount: order&.total_amount,
      description: description,
      status: :open,
      detected_at: Time.current
    )
  end
end
