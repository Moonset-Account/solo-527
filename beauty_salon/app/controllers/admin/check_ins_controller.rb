class Admin::CheckInsController < ApplicationController
  layout "admin"

  before_action :set_check_in, only: [:show, :update]

  def index
    @check_ins = CheckIn.includes(:customer, :technician, :treatment).order(checked_in_at: :desc)
    @check_ins = @check_ins.where(status: params[:status]) if params[:status].present?
    @check_ins = @check_ins.where(customer_id: params[:customer_id]) if params[:customer_id].present?
  end

  def show
    @audit_logs = AuditLog.by_auditable("CheckIn", @check_in.id).recent
  end

  def new
    @check_in = CheckIn.new
    @appointments = Appointment.today.where(status: [:confirmed, :pending])
    @customers = Customer.order(:name)
    @technicians = Technician.active_only
    @treatments = Treatment.active_only
  end

  def create
    @check_in = CheckIn.new(check_in_params)
    @check_in.checked_in_at = Time.current
    if @check_in.save
      @check_in.appointment&.update!(status: :in_progress) if @check_in.appointment
      AuditLog.create!(auditable: @check_in, action: "create", changes_data: @check_in.attributes, description: "到店核销")
      redirect_to admin_check_ins_path, notice: "核销成功"
    else
      @appointments = Appointment.today.where(status: [:confirmed, :pending])
      @customers = Customer.order(:name)
      @technicians = Technician.active_only
      @treatments = Treatment.active_only
      render :new, status: :unprocessable_content
    end
  end

  def update
    if @check_in.update(check_in_update_params)
      AuditLog.create!(auditable: @check_in, action: "update", changes_data: @check_in.previous_changes, description: "核销状态变更")
      redirect_to admin_check_ins_path, notice: "核销状态已更新"
    else
      render :show, status: :unprocessable_content
    end
  end

  private

  def set_check_in
    @check_in = CheckIn.find(params[:id])
  end

  def check_in_params
    params.require(:check_in).permit(:appointment_id, :customer_id, :technician_id, :treatment_id, :treatment_card_item_id, :status)
  end

  def check_in_update_params
    params.require(:check_in).permit(:status)
  end
end
