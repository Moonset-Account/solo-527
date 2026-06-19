class ShiftEnrollmentsController < ApplicationController
  def index
    @enrollments = ShiftEnrollment.where(user: current_user).includes(:shift).order(created_at: :desc)
  end

  def update
    @enrollment = ShiftEnrollment.find(params[:id])
    @enrollment.cancel!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("enrollment_#{@enrollment.id}", partial: "shift_enrollments/enrollment", locals: { enrollment: @enrollment }) }
      format.html { redirect_to shift_enrollments_url, notice: "Enrollment cancelled." }
    end
  end

  def destroy
    @enrollment = ShiftEnrollment.find(params[:id])
    @enrollment.destroy!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.remove("enrollment_#{@enrollment.id}") }
      format.html { redirect_to shift_enrollments_url, notice: "Enrollment removed." }
    end
  end
end
