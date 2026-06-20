class Ticket < ApplicationRecord
  has_paper_trail only: [:status, :assignee_id, :department_id, :process_node, :priority, :deadline, :title],
                  meta: { whodunnit: :paper_trail_user_id }

  belongs_to :submitter, class_name: 'User'
  belongs_to :assignee, class_name: 'User'
  belongs_to :department
  has_one :review_conclusion, dependent: :destroy
  has_many :audit_logs, dependent: :destroy

  enum :status, {
    pending: 0,
    in_progress: 1,
    completed: 2,
    exception: 3
  }

  enum :priority, {
    low: 0,
    normal: 1,
    high: 2,
    urgent: 3
  }

  PROCESS_NODES = %w[需求提交 需求分析 方案设计 开发实施 测试验证 上线部署 复盘总结].freeze

  validates :title, presence: true
  validates :status, presence: true
  validates :priority, presence: true
  validates :process_node, inclusion: { in: PROCESS_NODES, allow_blank: true }

  scope :by_status, ->(status) { where(status: status) if status.present? }
  scope :by_priority, ->(priority) { where(priority: priority) if priority.present? }
  scope :by_department, ->(dept_id) { where(department_id: dept_id) if dept_id.present? }
  scope :by_assignee, ->(user_id) { where(assignee_id: user_id) if user_id.present? }
  scope :by_submitter, ->(user_id) { where(submitter_id: user_id) if user_id.present? }
  scope :recent, -> { order(created_at: :desc) }
  scope :overdue, -> { where('deadline < ? AND status != ?', Time.current, statuses[:completed]) }

  def paper_trail_user_id
    PaperTrail.request.whodunnit
  end

  def status_name
    I18n.t("activerecord.attributes.ticket.statuses.#{status}", default: status.humanize)
  end

  def priority_name
    I18n.t("activerecord.attributes.ticket.priorities.#{priority}", default: priority.humanize)
  end

  def status_color
    case status
    when 'pending' then 'bg-yellow-100 text-yellow-800 border-yellow-200'
    when 'in_progress' then 'bg-blue-100 text-blue-800 border-blue-200'
    when 'completed' then 'bg-green-100 text-green-800 border-green-200'
    when 'exception' then 'bg-red-100 text-red-800 border-red-200'
    else 'bg-gray-100 text-gray-800 border-gray-200'
    end
  end

  def priority_color
    case priority
    when 'low' then 'bg-gray-100 text-gray-800'
    when 'normal' then 'bg-blue-100 text-blue-800'
    when 'high' then 'bg-orange-100 text-orange-800'
    when 'urgent' then 'bg-red-100 text-red-800'
    else 'bg-gray-100 text-gray-800'
    end
  end

  def overdue?
    deadline.present? && deadline < Time.current && !completed?
  end

  def efficiency_change
    return nil unless review_conclusion.present?
    review_conclusion.efficiency_after - review_conclusion.efficiency_before
  end

  def create_audit_log(user, action_type, field_name = nil, old_value = nil, new_value = nil, remark = nil)
    audit_logs.create!(
      user: user,
      action_type: action_type,
      field_name: field_name,
      old_value: old_value,
      new_value: new_value,
      remark: remark
    )
  end
end
