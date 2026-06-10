class RefundService
  def initialize(user)
    @user = user
  end

  def create_refund(order, reason:, amount: nil)
    raise "该订单不可退票" unless order.paid?
    raise "已存在待处理的退票申请" if order.refunds.pending.exists?
    refund_amount = amount.present? ? amount.to_d : order.total_amount
    raise "退款金额不能超过订单金额" if refund_amount > order.total_amount
    raise "退款金额必须大于0" if refund_amount <= 0
    refund = order.refunds.create!(
      user: @user,
      amount: refund_amount,
      reason: reason,
      status: :pending
    )
    AuditLogService.new.log(action: "refund_requested", auditable: refund, user: @user)
    refund
  end

  def approve(refund)
    raise "退票申请状态不允许审核" unless refund.pending?
    ActiveRecord::Base.transaction do
      refund.update!(status: :approved, reviewed_by: @user, reviewed_at: Time.current)
      refund.order.update!(status: :refunded)
      refund.order.tickets.each { |t| t.update!(status: :refunded) }
      refund.order.tickets.group(:ticket_type_id).count.each do |tt_id, qty|
        InventoryService.new.restore(TicketType.find(tt_id), qty)
      end
    end
    AuditLogService.new.log(action: "refund_approved", auditable: refund, user: @user)
    event = refund.order.tickets.first&.ticket_type&.event
    RevenueAnomalyJob.perform_later(event.id) if event
    refund
  end

  def reject(refund)
    raise "退票申请状态不允许审核" unless refund.pending?
    refund.update!(status: :rejected, reviewed_by: @user, reviewed_at: Time.current)
    AuditLogService.new.log(action: "refund_rejected", auditable: refund, user: @user)
    refund
  end
end
