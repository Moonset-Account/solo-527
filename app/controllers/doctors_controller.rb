class DoctorsController < ApplicationController
  before_action :set_doctor, only: [:show, :edit, :update, :destroy]

  def index
    @q = Doctor.ransack(params[:q])
    @doctors = @q.result.page(params[:page]).per(20)
  end

  def show
    @time_slots = @doctor.time_slots.on_date(Date.today).order(:start_time)
    @waiting_lists = @doctor.waiting_lists.waiting.order(:position)
  end

  def new
    @doctor = Doctor.new
  end

  def create
    @doctor = Doctor.new(doctor_params)
    if @doctor.save
      redirect_to @doctor, notice: "医生创建成功"
    else
      render :new
    end
  end

  def edit; end

  def update
    if @doctor.update(doctor_params)
      redirect_to @doctor, notice: "医生信息更新成功"
    else
      render :edit
    end
  end

  def destroy
    @doctor.destroy
    redirect_to doctors_url, notice: "医生已删除"
  end

  private

  def set_doctor
    @doctor = Doctor.find(params[:id])
  end

  def doctor_params
    params.require(:doctor).permit(:name, :title, :department, :phone, :active, :daily_max_patients, :notes)
  end
end
