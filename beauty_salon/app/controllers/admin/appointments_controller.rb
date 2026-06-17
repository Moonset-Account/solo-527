class Admin::AppointmentsController < ApplicationController
  layout "admin"

  before_action :set_appointment, only: [:show, :edit, :update, :destroy]

  def index
    @appointments = Appointment.includes(:customer, :technician, :treatment)
    @appointments = @appointments.by_status(params[:status]) if params[:status].present?
    @appointments = @appointments.by_technician(params[:technician_id]) if params[:technician_id].present?
    @appointments = @appointments.date_range(params[:start_date], params[:end_date])
    @appointments = @appointments.order(scheduled_at: :desc)
    @statuses = Appointment.statuses.keys
    @technicians = Technician.active_only
  end

  def show
  end

  def new
    @appointment = Appointment.new
    @customers = Customer.order(:name)
    @technicians = Technician.active_only
    @treatments = Treatment.active_only
    @treatment_cards = []
  end

  def create
    @appointment = Appointment.new(appointment_params)
    if @appointment.save
      AuditLog.create!(auditable: @appointment, action: "create", changes_data: @appointment.attributes, description: "预约创建")
      redirect_to admin_appointment_path(@appointment), notice: "预约创建成功"
    else
      @customers = Customer.order(:name)
      @technicians = Technician.active_only
      @treatments = Treatment.active_only
      @treatment_cards = []
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @customers = Customer.order(:name)
    @technicians = Technician.active_only
    @treatments = Treatment.active_only
  end

  def update
    if @appointment.update(appointment_params)
      redirect_to admin_appointment_path(@appointment), notice: "预约更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @appointment.update!(status: :cancelled)
    redirect_to admin_appointments_path, notice: "预约已取消"
  end

  private

  def set_appointment
    @appointment = Appointment.find(params[:id])
  end

  def appointment_params
    params.require(:appointment).permit(:customer_id, :technician_id, :treatment_id, :treatment_card_item_id, :scheduled_at, :status, :notes)
  end
end
