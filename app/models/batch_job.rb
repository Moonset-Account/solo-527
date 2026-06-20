class BatchJob < ApplicationRecord
  belongs_to :user, optional: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_status, ->(status) { where(status: status) }
  scope :by_type, ->(type) { where(job_type: type) }

  validates :job_type, presence: true
  validates :status, inclusion: { in: %w[pending running completed failed cancelled] }

  def start!
    update!(status: "running", started_at: Time.current, success_count: 0, failure_count: 0)
  end

  def increment_success!
    increment!(:success_count)
  end

  def increment_failure!(error_message = nil)
    increment!(:failure_count)
    if error_message
      failures = failure_details_list
      failures << error_message
      update!(failure_details: failures.join("\n"))
    end
  end

  def complete!(result_data = {})
    update!(
      status: "completed",
      completed_at: Time.current,
      result_data: result_data
    )
  end

  def fail!(error_message)
    update!(
      status: "failed",
      completed_at: Time.current,
      error_message: error_message
    )
  end

  def cancel!
    update!(status: "cancelled", completed_at: Time.current)
  end

  def progress_percent
    return 0 if total_count.zero?
    ((success_count + failure_count).to_f / total_count * 100).round(2)
  end

  def progress_percentage
    progress_percent
  end

  def failure_details_list
    failure_details.to_s.split("\n").reject(&:empty?)
  end

  def running?
    status == "running"
  end

  def completed?
    status == "completed"
  end

  def failed?
    status == "failed"
  end

  def pending?
    status == "pending"
  end

  def status_text
    case status
    when "pending" then "等待中"
    when "running" then "进行中"
    when "completed" then "已完成"
    when "failed" then "失败"
    when "cancelled" then "已取消"
    else status
    end
  end

  def job_type_text
    case job_type
    when "schedule_generation" then "赛程生成"
    when "bulk_checkin" then "批量签到"
    when "export_data" then "数据导出"
    when "import_data" then "数据导入"
    when "payment_retry" then "支付重试"
    when "course_fill_rate_report" then "满班率报表"
    else job_type
    end
  end
end
