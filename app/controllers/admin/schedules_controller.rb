module Admin
  class SchedulesController < BaseController
    before_action :set_schedule, only: [:show, :edit, :update, :start, :complete, :cancel]

    def index
      @q = Schedule.ransack(params[:q])
      @schedules = @q.result.includes(:event, :venue).order(start_time: :desc).page(params[:page]).per(20)
    end

    def show
      @results = @schedule.results.ranked
      @versions = @schedule.versions.reorder(created_at: :desc).limit(10)
    end

    def edit
    end

    def update
      if @schedule.update(schedule_params)
        redirect_to [:admin, @schedule], notice: "赛程更新成功。"
      else
        render :edit
      end
    end

    def start
      @schedule.start!
      redirect_to [:admin, @schedule], notice: "比赛已开始。"
    end

    def complete
      @schedule.complete!
      redirect_to [:admin, @schedule], notice: "比赛已完成。"
    end

    def cancel
      @schedule.cancel!
      redirect_to [:admin, @schedule], notice: "比赛已取消。"
    end

    private

    def set_schedule
      @schedule = Schedule.find(params[:id])
    end

    def schedule_params
      params.require(:schedule).permit(:title, :category, :round, :start_time, :end_time,
        :max_participants, :description, :status, :venue_id)
    end
  end
end
