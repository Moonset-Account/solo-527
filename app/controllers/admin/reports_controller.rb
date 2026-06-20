module Admin
  class ReportsController < BaseController
    def fill_rate
      @q = Course.ransack(params[:q])
      @courses = @q.result.page(params[:page]).per(20)

      @total_courses = Course.count
      @full_courses = Course.where("enrolled_count >= capacity").count
      @low_fill_courses = Course.where("capacity > 0 AND enrolled_count::float / NULLIF(capacity, 0) < 0.5").count
      @avg_fill_rate = Course.where("capacity > 0").average("enrolled_count::float / NULLIF(capacity, 0) * 100").to_f.round(2)
    end

    def generate_fill_rate
      course_id = params[:course_id]

      batch_job = BatchJob.create!(
        job_type: "course_fill_rate_report",
        user: current_user,
        status: "pending"
      )

      jid = CourseFillRateReportJob.perform_async(course_id)
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "满班率报表生成任务已提交。"
    end

    def export_fill_rate
      batch_job = BatchJob.create!(
        job_type: "export_data",
        user: current_user,
        status: "pending"
      )

      jid = DataExportJob.perform_async("fill_rate_report", params.to_unsafe_h.slice(:q))
      batch_job.update!(sidekiq_jid: jid)

      redirect_to admin_batch_job_path(batch_job), notice: "满班率报表导出任务已提交。"
    end
  end
end
