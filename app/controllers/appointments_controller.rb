class AppointmentsController < ApplicationController
  before_action :set_appointment, only: [:show, :edit, :update, :destroy, :confirm, :complete, :no_show, :cancel, :refund]

  def index
    @q = Appointment.includes(:customer, :doctor, :time_slot, :waiting_list).ransack(params[:q])
    @appointments = @q.result.order(created_at: :desc).page(params[:page]).per(30)

    @stats = {
      total: Appointment.count,
      pending: Appointment.pending.count,
      confirmed: Appointment.confirmed.count,
      completed: Appointment.completed.count,
      cancelled: Appointment.cancelled.count,
      no_show: Appointment.no_show.count,
      from_waiting: Appointment.from_waiting_list.count
    }
  end

  def show
    @detailed = @appointment.detailed_record
    @refund_records = @appointment.refund_records
    @service_items = @appointment.appointment_service_items.includes(:service_item)
    @waiting_history = @appointment.waiting_list&.before_after_snapshots || []
  end

  def new
    @appointment = Appointment.new
    @doctors = Doctor.active
    @customers = Customer.all
    @service_items = ServiceItem.active.dental_cleaning
    @time_slots = []
    if params[:doctor_id].present?
      doctor = Doctor.find(params[:doctor_id])
      @time_slots = doctor.time_slots.on_date(Date.today).available.order(:start_time)
    end
  end

  def create
    customer = Customer.find_or_create_by(phone: appointment_params[:phone]) do |c|
      c.name = appointment_params[:customer_name]
      c.phone = appointment_params[:phone]
    end

    doctor = Doctor.find(appointment_params[:doctor_id])
    time_slot = TimeSlot.find(appointment_params[:time_slot_id])
    service_items = ServiceItem.where(id: Array(appointment_params[:service_item_ids]))

    if time_slot.has_available_spots?
      appointment = Appointment.create_direct!(
        customer, doctor, time_slot,
        service_items: service_items,
        operator: current_operator
      )

      if appointment_params[:paid_amount].present?
        appointment.update!(paid_amount: appointment_params[:paid_amount])
        appointment.confirm_appointment! if appointment.may_confirm_appointment?
      end

      redirect_to appointment, notice: "预约创建成功：#{appointment.appointment_no}"
    else
      redirect_to new_appointment_path(doctor_id: doctor.id), alert: "该时段已满，可加入候补队列"
    end
  end

  def edit
    @doctors = Doctor.active
    @customers = Customer.all
  end

  def update
    if @appointment.update(appointment_update_params)
      redirect_to @appointment, notice: "预约更新成功"
    else
      render :edit
    end
  end

  def destroy
    @appointment.destroy
    redirect_to appointments_url, notice: "预约已删除"
  end

  def confirm
    if @appointment.confirm_appointment!
      redirect_to @appointment, notice: "预约已确认"
    else
      redirect_to @appointment, alert: "操作失败"
    end
  end

  def complete
    if @appointment.complete!
      redirect_to @appointment, notice: "预约已完成"
    else
      redirect_to @appointment, alert: "操作失败"
    end
  end

  def no_show
    if @appointment.mark_no_show!
      redirect_to @appointment, notice: "已标记为爽约"
    else
      redirect_to @appointment, alert: "操作失败"
    end
  end

  def cancel
    if @appointment.cancel_appointment!
      @appointment.update(cancel_reason: params[:cancel_reason])
      redirect_to @appointment, notice: "预约已取消"
    else
      redirect_to @appointment, alert: "操作失败"
    end
  end

  def refund
    amount = params[:refund_amount].to_d
    reason = params[:refund_reason]
    service_item_id = params[:service_item_id]
    service_item = @appointment.appointment_service_items.find_by(id: service_item_id)

    refund = @appointment.process_refund!(
      amount, reason,
      method: params[:refund_method] || "original",
      service_item: service_item,
      operator: current_operator
    )

    if refund
      redirect_to @appointment, notice: "退款处理成功：#{refund.refund_no}"
    else
      redirect_to @appointment, alert: "退款失败：金额超出可退范围"
    end
  end

  private

  def set_appointment
    @appointment = Appointment.find(params[:id])
  end

  def appointment_params
    params.require(:appointment).permit(:customer_name, :phone, :doctor_id, :time_slot_id,
                                        :paid_amount, :notes, service_item_ids: [])
  end

  def appointment_update_params
    params.require(:appointment).permit(:notes, :paid_amount, :status)
  end
end
