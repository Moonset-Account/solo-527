module Admin
  class CheckInsController < BaseController
    before_action :set_check_in, only: [:show, :check_in]

    def index
      @q = CheckIn.ransack(params[:q])
      @check_ins = @q.result.includes(:user, :checkinable).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @check_in.versions.reorder(created_at: :desc).limit(20)
    end

    def check_in
      @check_in.check_in!("manual", current_user)
      redirect_to [:admin, @check_in], notice: "签到成功。"
    end

    def bulk_check_in
      user_ids = params[:user_ids] || []
      checkinable_type = params[:checkinable_type]
      checkinable_id = params[:checkinable_id]

      check_in_params_list = user_ids.map do |user_id|
        {
          user_id: user_id,
          checkinable_type: checkinable_type,
          checkinable_id: checkinable_id,
          status: "pending"
        }
      end

      batch_job = BatchJob.create!(
        job_type: "bulk_check_in",
        user: current_user,
        status: "pending"
      )

      jid = BulkCheckInJob.perform_async(check_in_params_list, current_user.id)
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "批量签到任务已提交。"
    end

    def export
      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("check_ins", params.to_unsafe_h.slice(:q))
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "导出任务已提交。"
    end

    private

    def set_check_in
      @check_in = CheckIn.find(params[:id])
    end
  end
end
