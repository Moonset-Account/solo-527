class RegistrationsController < ApplicationController
  skip_before_action :authenticate_user!, only: [:new, :create, :show]
  before_action :set_registration, only: [:show, :cancel]

  def index
    @registrations = policy_scope(Registration).where(user: current_user)
      .includes(:session, :school).order(created_at: :desc)
  end

  def my_registrations
    authorize Registration, :my_registrations?
    @registrations = current_user.registrations.includes(session: :course)
      .order(created_at: :desc)
  end

  def show
  end

  def new
    @session = Session.find(params[:session_id])
    @registration = Registration.new(session: @session)
    @schools = School.active_schools.order(:name)
    @registration.students.build
    skip_authorization
  end

  def create
    @registration = Registration.new(registration_params)
    @registration.user = current_user if user_signed_in?
    @registration.status = :pending
    @registration.submitted_at = Time.current
    @registration.student_count = @registration.students.size if @registration.students.any?
    skip_authorization

    if @registration.save
      if @registration.user.present?
        Notification.create(
          user: @registration.user,
          title: '报名提交成功',
          content: "您的#{@registration.session.course.title}课程报名已提交，等待审核。",
          notification_type: 'registration_submitted',
          related_object: @registration
        )
      end
      redirect_to registration_path(@registration), notice: '报名提交成功，请等待审核'
    else
      @session = @registration.session
      @schools = School.active_schools.order(:name)
      render :new
    end
  end

  def cancel
    authorize @registration, :cancel?

    if @registration.cancel!
      redirect_to registration_path(@registration), notice: '报名已取消'
    else
      redirect_to registration_path(@registration), alert: '取消失败'
    end
  end

  private

  def set_registration
    @registration = Registration.find(params[:id])
    authorize @registration
  end

  def registration_params
    params.require(:registration).permit(:session_id, :school_id, :registration_type,
                                          :student_count, :contact_name, :contact_phone,
                                          :contact_email, :notes,
                                          students_attributes: [:id, :name, :gender, :age_group, :_destroy])
  end
end
