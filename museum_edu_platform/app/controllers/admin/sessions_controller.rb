module Admin
  class SessionsController < BaseController
    before_action :set_session, only: [:show, :edit, :update, :destroy, :check_in_list, :attendance_report, :assign_guide, :remove_guide, :qr_code]

    def index
      @sessions = policy_scope(Session).includes(:course, :guides)
        .order(start_at: :desc)
      @sessions = @sessions.by_status(params[:status]) if params[:status].present?
    end

    def show
      @available_guides = @session.available_guides
    end

    def new
      @course = Course.find(params[:course_id]) if params[:course_id].present?
      @session = Session.new
      @session.course = @course if @course
      authorize @session
    end

    def edit
    end

    def create
      @session = Session.new(session_params)
      authorize @session

      if @session.save
        redirect_to admin_session_path(@session), notice: '场次创建成功'
      else
        render :new
      end
    end

    def update
      if @session.update(session_params)
        redirect_to admin_session_path(@session), notice: '场次更新成功'
      else
        render :edit
      end
    end

    def destroy
      @session.destroy
      redirect_to admin_sessions_path, notice: '场次已删除'
    end

    def check_in_list
      @check_ins = @session.check_ins.includes(:student, :registration).order(checked_in_at: :desc)
    end

    def attendance_report
      @registrations = @session.registrations.includes(:school, :students)
      @check_ins = @session.check_ins
    end

    def assign_guide
      guide = User.find(params[:guide_id])
      role = params[:role] || 'main'

      if @session.assign_guide(guide, role)
        redirect_to admin_session_path(@session), notice: '讲解员安排成功'
      else
        redirect_to admin_session_path(@session), alert: '讲解员安排失败：该讲解员在此时段已有安排'
      end
    end

    def remove_guide
      session_guide = @session.session_guides.find_by(user_id: params[:guide_id])
      if session_guide&.destroy
        redirect_to admin_session_path(@session), notice: '已移除讲解员'
      else
        redirect_to admin_session_path(@session), alert: '移除失败'
      end
    end

    def qr_code
      respond_to do |format|
        format.html
        format.svg do
          send_data @session.qr_code_svg, type: 'image/svg+xml', disposition: 'inline'
        end
      end
    end

    private

    def set_session
      @session = Session.find(params[:id])
      authorize @session
    end

    def session_params
      params.require(:session).permit(:course_id, :start_at, :end_at, :location, :capacity, :status, :notes)
    end
  end
end
