class Api::V1::TeacherSettlementsController < Api::V1::BaseController
  def index
    authorize TeacherSettlement
    settlements = policy_scope(TeacherSettlement)
    settlements = settlements.by_teacher(params[:teacher_id]) if params[:teacher_id].present?
    settlements = settlements.where(status: params[:status]) if params[:status].present?
    settlements = settlements.pending_approval if params[:pending].present?
    settlements = settlements.order(created_at: :desc).page(params[:page]).per(params[:per_page] || 20)

    render json: {
      settlements: settlements.as_json(
        include: {
          teacher: {
            include: { user: { only: [:id, :name, :phone] } },
            only: [:id]
          },
          approved_by: { only: [:id, :name] }
        }
      ),
      teacher_settlements: settlements.as_json(
        include: {
          teacher: {
            include: { user: { only: [:id, :name, :phone] } },
            only: [:id]
          }
        }
      ),
      meta: pagination_meta(settlements)
    }, status: :ok
  end

  def show
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement
    render json: @settlement.as_json(
      include: {
        teacher: {
          include: { user: { only: [:id, :name, :phone, :avatar_url] } },
          only: [:id, :hourly_rate, :specialties]
        },
        approved_by: { only: [:id, :name] }
      }
    ), status: :ok
  end

  def generate
    authorize TeacherSettlement, :create?
    result = TeacherSettlements::GenerateService.new(
      params.permit(:teacher_id, :period_start, :period_end),
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def approve
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement, :approve?
    @settlement.update!(status: :approved, approved_by: current_user, approved_at: Time.current)

    Notification.send_notification!(
      @settlement.teacher.user,
      '结算单已通过',
      "您的结算单 #{@settlement.settlement_no} 已通过审批，金额 #{@settlement.total_amount} 元",
      'settlement_approved',
      settlement_id: @settlement.id
    )

    render json: @settlement, status: :ok
  end

  def reject
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement, :reject?
    @settlement.update!(status: :rejected, notes: params[:reason])

    Notification.send_notification!(
      @settlement.teacher.user,
      '结算单被驳回',
      "您的结算单 #{@settlement.settlement_no} 被驳回，原因：#{params[:reason] || '请联系管理员'}",
      'settlement_rejected',
      settlement_id: @settlement.id
    )

    render json: @settlement, status: :ok
  end

  def mark_paid
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement, :mark_paid?
    @settlement.update!(status: :paid, paid_at: Time.current)
    render json: @settlement, status: :ok
  end

  def submit
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement, :submit?
    @settlement.update!(status: :pending_approval)
    render json: @settlement, status: :ok
  end

  def pay
    @settlement = TeacherSettlement.find(params[:id])
    authorize @settlement, :pay?
    @settlement.update!(status: :paid, paid_at: Time.current)
    render json: @settlement, status: :ok
  end

  def export
    authorize TeacherSettlement
    settlements = policy_scope(TeacherSettlement)
    settlements = settlements.in_period(params[:start_date], params[:end_date]) if params[:start_date].present?

    columns = [
      { label: '结算编号', value: :settlement_no },
      { label: '老师姓名', value: ->(s) { s.teacher.user.name } },
      { label: '结算周期', value: ->(s) { "#{s.period_start} 至 #{s.period_end}" } },
      { label: '课程数', value: :total_sessions },
      { label: '学员数', value: :total_students },
      { label: '基础金额', value: :base_amount },
      { label: '奖金', value: :bonus_amount },
      { label: '扣款', value: :deduction_amount },
      { label: '总金额', value: :total_amount },
      { label: '状态', value: ->(s) { I18n.t("enums.teacher_settlement.status.#{s.status}") } },
      { label: '创建时间', value: ->(s) { s.created_at.strftime('%Y-%m-%d %H:%M:%S') } }
    ]

    export_to_csv(settlements, '老师结算', columns)
  end

end
