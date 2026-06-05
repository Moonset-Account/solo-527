class Api::V1::BookingsController < Api::V1::BaseController
  def index
    authorize Booking
    bookings = policy_scope(Booking)
    bookings = bookings.by_status(params[:status]) if params[:status].present?
    bookings = bookings.by_student(params[:student_id]) if params[:student_id].present?
    bookings = bookings.by_course_session(params[:course_session_id]) if params[:course_session_id].present?
    bookings = bookings.includes(:course_session, :student, :payments).order(created_at: :desc)
    bookings = bookings.page(params[:page]).per(params[:per_page] || 20)

    render json: {
      bookings: bookings.as_json(
        include: {
          course_session: {
            include: {
              course: { only: [:id, :title, :cover_url] },
              teacher: {
                include: { user: { only: [:name] } },
                only: [:id]
              }
            },
            only: [:id, :start_time, :end_time, :location]
          },
          student: {
            include: { user: { only: [:name, :phone] } },
            only: [:id]
          },
          payments: { only: [:id, :amount, :status, :paid_at] }
        }
      ),
      meta: pagination_meta(bookings)
    }, status: :ok
  end

  def show
    @booking = Booking.find(params[:id])
    authorize @booking
    render json: @booking.as_json(
      include: {
        course_session: {
          include: {
            course: { only: [:id, :title, :cover_url, :description, :difficulty_level] },
            teacher: {
              include: { user: { only: [:id, :name, :avatar_url] } },
              only: [:id, :specialties]
            }
          },
          only: [:id, :start_time, :end_time, :location]
        },
        material_package: { only: [:id, :name, :sku, :sale_price] },
        student: {
          include: { user: { only: [:id, :name, :phone, :avatar_url] } },
          only: [:id]
        },
        payments: { only: [:id, :payment_no, :amount, :payment_method, :status, :paid_at, :transaction_id] }
      }
    ), status: :ok
  end

  def create
    authorize Booking
    result = Bookings::CreateService.new(
      booking_params,
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def cancel
    @booking = Booking.find(params[:id])
    authorize @booking, :cancel?
    result = Bookings::CancelService.new(
      { id: params[:id], cancel_reason: params[:cancel_reason] },
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def approve
    @booking = Booking.find(params[:id])
    authorize @booking, :approve?
    result = Bookings::ApproveService.new(
      { id: params[:id] },
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def reject
    @booking = Booking.find(params[:id])
    authorize @booking, :reject?
    @booking.update!(status: :rejected, approved_by: current_user, approved_at: Time.current)
    render json: @booking, status: :ok
  end

  def check_in
    @booking = Booking.find(params[:id])
    authorize @booking, :check_in?
    @booking.update!(attendance_status: :checked_in)
    @booking.course_session.increment!(:attended_count)
    render json: @booking, status: :ok
  end

  def export
    authorize Booking
    bookings = policy_scope(Booking)
    bookings = bookings.in_date_range(params[:start_date], params[:end_date]) if params[:start_date].present?

    columns = [
      { label: '报名编号', value: :booking_no },
      { label: '学员姓名', value: ->(b) { b.student.user.name } },
      { label: '联系电话', value: ->(b) { b.student.user.phone } },
      { label: '课程名称', value: ->(b) { b.course_session.course.title } },
      { label: '上课时间', value: ->(b) { b.course_session.start_time.strftime('%Y-%m-%d %H:%M') } },
      { label: '上课地点', value: ->(b) { b.course_session.location } },
      { label: '课程费用', value: :course_fee },
      { label: '材料费用', value: :material_fee },
      { label: '总金额', value: :total_amount },
      { label: '支付状态', value: ->(b) { I18n.t("enums.booking.payment_status.#{b.payment_status}") } },
      { label: '报名状态', value: ->(b) { I18n.t("enums.booking.status.#{b.status}") } },
      { label: '创建时间', value: ->(b) { b.created_at.strftime('%Y-%m-%d %H:%M:%S') } }
    ]

    export_to_csv(bookings, '报名记录', columns)
  end

  private

  def booking_params
    params.permit(:course_session_id, :notes)
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end
end
