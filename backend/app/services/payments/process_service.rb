class Payments::ProcessService < ApplicationService
  def call
    return error('报名不存在') unless booking
    return error('无法支付该订单') unless booking.can_pay?
    return error('学员信息不匹配') unless booking.student.user_id == current_user.id

    result = nil

    ActiveRecord::Base.transaction do
      @payment = Payment.new(
        booking: booking,
        student: booking.student,
        amount: booking.outstanding_amount,
        payment_method: params[:payment_method] || 'wechat',
        status: :pending
      )

      unless simulate_payment_success
        @payment.update!(status: :failed, failure_reason: '支付失败')
        return error('支付处理失败')
      end

      @payment.update!(
        status: :success,
        paid_at: Time.current,
        transaction_id: generate_transaction_id
      )

      new_paid_amount = booking.paid_amount + @payment.amount
      is_fully_paid = new_paid_amount >= booking.total_price

      booking.update!(
        paid_amount: new_paid_amount,
        payment_status: is_fully_paid ? :paid : :pending_payment,
        status: is_fully_paid ? :paid : booking.status,
        paid_at: is_fully_paid ? Time.current : booking.paid_at
      )

      if booking.material_package
        booking.material_package.deduct_reserved!(1)
      end

      log_audit('payment_success', @payment, {}, @payment.attributes)

      send_notification(
        current_user,
        '支付成功',
        "您已成功支付 #{@payment.amount} 元，课程 #{booking.course_session.course.title} 报名完成",
        'payment_success',
        payment_id: @payment.id,
        booking_id: booking.id
      )

      result = success(@payment)
    end

    result || error('支付处理失败')
  rescue StandardError => e
    error(e.message)
  end

  private

  def booking
    @booking ||= Booking.find_by(id: params[:booking_id])
  end

  def simulate_payment_success
    true
  end

  def generate_transaction_id
    "TXN#{Time.current.strftime('%Y%m%d%H%M%S')}#{SecureRandom.hex(4).upcase}"
  end
end
