class WaitingListsController < ApplicationController
  before_action :set_waiting_list, only: [:show, :convert_to_appointment, :cancel]

  def index
    @q = WaitingList.includes(:customer, :doctor, :time_slot, :service_item).ransack(params[:q])
    @waiting_lists = @q.result.order(created_at: :desc).page(params[:page]).per(30)
    @stats = {
      total: WaitingList.count,
      waiting: WaitingList.waiting.count,
      notified: WaitingList.notified.count,
      converted: WaitingList.converted.count,
      cancelled: WaitingList.cancelled.count
    }
  end

  def show
    @change_logs = @waiting_list.change_logs
  end

  def new
    @waiting_list = WaitingList.new
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
    customer = Customer.find_or_create_by(phone: params[:phone]) do |c|
      c.name = params[:customer_name]
      c.phone = params[:phone]
    end

    doctor = Doctor.find(params[:doctor_id])
    time_slot = TimeSlot.find_by(id: params[:time_slot_id])
    service_item = ServiceItem.find_by(id: params[:service_item_id])

    entry = WaitingList.add_customer(
      customer, doctor,
      time_slot: time_slot,
      service_item: service_item,
      operator: current_operator
    )

    if entry
      redirect_to entry, notice: "已加入候补队列，当前位置：#{entry.position}，追踪码：#{entry.tracking_code}"
    else
      redirect_to new_waiting_list_path, alert: "该时段候补队列已满"
    end
  end

  def convert_to_appointment
    service_items = @waiting_list.service_item ? [@waiting_list.service_item] : []
    appointment = @waiting_list.convert_to_appointment!(
      service_items: service_items,
      operator: current_operator
    )

    if appointment
      redirect_to appointment, notice: "候补已转化为预约：#{appointment.appointment_no}"
    else
      redirect_to @waiting_list, alert: "转化失败：#{@waiting_list.errors.full_messages.join('，')}"
    end
  end

  def cancel
    if @waiting_list.cancel!(reason: params[:reason], operator: current_operator)
      redirect_to waiting_lists_path, notice: "候补已取消"
    else
      redirect_to @waiting_list, alert: "取消失败"
    end
  end

  def auto_release
    WaitingListAutoReleaseJob.perform_later
    redirect_to waiting_lists_path, notice: "自动释放任务已启动"
  end

  private

  def set_waiting_list
    @waiting_list = WaitingList.find(params[:id])
  end

  def waiting_list_params
    params.require(:waiting_list).permit(:customer_name, :phone, :doctor_id, :time_slot_id, :service_item_id, :notes)
  end
end
