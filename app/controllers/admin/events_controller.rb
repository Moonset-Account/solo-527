module Admin
  class EventsController < BaseController
    before_action :set_event, only: [:show, :edit, :update, :destroy, :generate_schedules, :export_registrations]

    def index
      @q = Event.ransack(params[:q])
      @events = @q.result.order(start_date: :desc).page(params[:page]).per(20)
    end

    def show
      @registrations = @event.event_registrations.includes(:user).order(created_at: :desc).limit(20)
      @schedules = @event.schedules.ordered
      @versions = @event.versions.reorder(created_at: :desc).limit(10)
    end

    def new
      @event = Event.new
      authorize @event
    end

    def create
      @event = Event.new(event_params)
      authorize @event

      if @event.save
        redirect_to [:admin, @event], notice: "赛事创建成功。"
      else
        render :new
      end
    end

    def edit
      authorize @event
    end

    def update
      authorize @event
      if @event.update(event_params)
        redirect_to [:admin, @event], notice: "赛事更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @event
      @event.destroy
      redirect_to admin_events_path, notice: "赛事已删除。"
    end

    def generate_schedules
      authorize @event, :generate_schedules?

      batch_job = BatchJob.create!(
        job_type: "schedule_generation",
        user: current_user,
        status: "pending"
      )

      jid = ScheduleGenerationJob.perform_async(
        @event.id,
        { per_schedule: params[:per_schedule] || 8, category: params[:category] }
      )
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "赛程生成任务已提交。"
    end

    def export_registrations
      authorize @event, :export?

      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("event_registrations", { event_id: @event.id })
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交。"
    end

    private

    def set_event
      @event = Event.find(params[:id])
    end

    def event_params
      params.require(:event).permit(:name, :description, :event_type, :start_date,
        :end_date, :registration_start, :registration_end, :max_participants,
        :registration_fee, :status, :venue_id, :rules, :prizes)
    end
  end
end
