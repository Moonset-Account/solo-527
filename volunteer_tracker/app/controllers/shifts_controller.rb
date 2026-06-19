class ShiftsController < ApplicationController
  before_action :set_shift, only: [:show, :edit, :update, :destroy, :enroll, :check_in]

  def index
    @shifts = Shift.order(start_time: :asc)
  end

  def show
    @enrollments = @shift.shift_enrollments.includes(:user)
  end

  def new
    @shift = Shift.new
  end

  def create
    @shift = Shift.new(shift_params)
    if @shift.save
      redirect_to @shift, notice: "Shift was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @shift.update(shift_params)
      redirect_to @shift, notice: "Shift was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @shift.destroy!
    redirect_to shifts_url, notice: "Shift was successfully destroyed."
  end

  def enroll
    @shift.shift_enrollments.create!(user: current_user)
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("shift_#{@shift.id}", partial: "shifts/shift", locals: { shift: @shift }) }
      format.html { redirect_to @shift, notice: "Successfully enrolled." }
    end
  end

  def check_in
    enrollment = @shift.shift_enrollments.find_by!(user: current_user)
    enrollment.check_in!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("shift_#{@shift.id}", partial: "shifts/shift", locals: { shift: @shift }) }
      format.html { redirect_to @shift, notice: "Successfully checked in." }
    end
  end

  private

  def set_shift
    @shift = Shift.find(params[:id])
  end

  def shift_params
    params.require(:shift).permit(:title, :description, :start_time, :end_time, :capacity, :status)
  end
end
