class Api::V1::PaymentsController < Api::V1::BaseController
  def index
    payments = policy_scope(Payment)
    payments = payments.by_student(params[:student_id]) if params[:student_id].present?
    payments = payments.in_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?
    payments = payments.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)

    render json: {
      payments: payments.as_json(
        include: {
          booking: { only: [:id, :booking_no] },
          student: {
            include: { user: { only: [:name, :phone] } },
            only: [:id]
          }
        }
      ),
      meta: pagination_meta(payments)
    }, status: :ok
  end

  def create
    authorize Payment
    result = Payments::ProcessService.new(
      payment_params,
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def export
    authorize Payment
    payments = policy_scope(Payment).success
    payments = payments.in_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?

    columns = [
      { label: '支付编号', value: :payment_no },
      { label: '报名编号', value: ->(p) { p.booking.booking_no } },
      { label: '学员姓名', value: ->(p) { p.student.user.name } },
      { label: '支付金额', value: :amount },
      { label: '支付方式', value: :payment_method },
      { label: '交易单号', value: :transaction_id },
      { label: '支付状态', value: ->(p) { I18n.t("enums.payment.status.#{p.status}") } },
      { label: '支付时间', value: ->(p) { p.paid_at&.strftime('%Y-%m-%d %H:%M:%S') } },
      { label: '创建时间', value: ->(p) { p.created_at.strftime('%Y-%m-%d %H:%M:%S') } }
    ]

    export_to_csv(payments, '支付记录', columns)
  end

  private

  def payment_params
    params.permit(:booking_id, :payment_method)
  end
end
