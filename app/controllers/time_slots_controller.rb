class TimeSlotsController < ApplicationController
  before_action :set_doctor, only: [:index, :new, :create]
  before_action :set_time_slot, only: [:show, :edit, :update, :destroy]

  def index
    @date = params[:date] ? Date.parse(params[:date]) : Date.today
    @time_slots = @doctor.time_slots.on_date(@date).order(:start_time)
  end

  def show
    @waiting_lists = @time_slot.waiting_list_entries
    @appointments = @time_slot.appointments.includes(:customer)
  end

  def new
    @time_slot = @doctor.time_slots.new
    @start_date = params[:date] ? Date.parse(params[:date]) : Date.today
  end

  def create
    @time_slot = @doctor.time_slots.new(time_slot_params)
    if @time_slot.save
      generate_weekly_slots if params[:generate_weekly] == "1"
      redirect_to doctor_time_slots_path(@doctor, date: @time_slot.start_time.to_date),
                  notice: "时段创建成功"
    else
      render :new
    end
  end

  def edit; end

  def update
    if @time_slot.update(time_slot_params)
      redirect_to @time_slot, notice: "时段更新成功"
    else
      render :edit
    end
  end

  def destroy
    doctor = @time_slot.doctor
    date = @time_slot.start_time.to_date
    @time_slot.destroy
    redirect_to doctor_time_slots_path(doctor, date: date), notice: "时段已删除"
  end

  private

  def set_doctor
    @doctor = Doctor.find(params[:doctor_id])
  end

  def set_time_slot
    @time_slot = TimeSlot.find(params[:id])
    @doctor = @time_slot.doctor
  end

  def time_slot_params
    params.require(:time_slot).permit(:start_time, :end_time, :capacity, :notes)
  end

  def generate_weekly_slots
    base_time = @time_slot.start_time
    (1..6).each do |i|
      new_start = base_time + i.days
      new_end = new_start + (@time_slot.end_time - @time_slot.start_time)
      @doctor.time_slots.create!(
        start_time: new_start,
        end_time: new_end,
        capacity: @time_slot.capacity,
        notes: @time_slot.notes
      )
    end
  end
end
