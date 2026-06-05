class ImportExportJob < ApplicationRecord
  belongs_to :creator, class_name: 'User', optional: true

  validates :job_type, presence: true, inclusion: { in: %w[import_people import_passes export_people export_passes export_violations export_gate_logs] }
  validates :status, presence: true, inclusion: { in: %w[pending processing completed failed] }

  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(job_type: type) }
  scope :by_status, ->(status) { where(status: status) }

  JOB_TYPE_NAMES = {
    'import_people' => '导入人员',
    'import_passes' => '导入通行证',
    'export_people' => '导出人员台账',
    'export_passes' => '导出通行证台账',
    'export_violations' => '导出违规记录',
    'export_gate_logs' => '导出门岗记录'
  }.freeze

  STATUS_NAMES = {
    'pending' => '等待中',
    'processing' => '处理中',
    'completed' => '已完成',
    'failed' => '失败'
  }.freeze

  def job_type_name
    JOB_TYPE_NAMES[job_type] || job_type
  end

  def status_name
    STATUS_NAMES[status] || status
  end

  def start!
    update!(status: 'processing', started_at: Time.current)
  end

  def complete!(success_count: 0, failed_count: 0, error_messages: nil)
    update!(
      status: 'completed',
      completed_at: Time.current,
      success_count: success_count,
      failed_count: failed_count,
      processed_count: success_count + failed_count,
      error_messages: error_messages
    )
  end

  def fail!(error_messages)
    update!(status: 'failed', completed_at: Time.current, error_messages: error_messages)
  end

  def completed?
    status == 'completed'
  end
end
