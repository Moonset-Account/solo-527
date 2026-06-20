class AuditLog < ApplicationRecord
  belongs_to :ticket
  belongs_to :user

  enum :action_type, {
    create_ticket: 0,
    update_status: 1,
    update_assignee: 2,
    update_department: 3,
    update_process_node: 4,
    update_priority: 5,
    update_deadline: 6,
    update_title: 7,
    update_description: 8,
    create_review: 9,
    update_review: 10,
    add_remark: 11,
    update_efficiency: 12
  }

  validates :action_type, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_action_type, ->(type) { where(action_type: type) if type.present? }
  scope :by_user, ->(user_id) { where(user_id: user_id) if user_id.present? }
  scope :by_ticket, ->(ticket_id) { where(ticket_id: ticket_id) if ticket_id.present? }
  scope :date_range, ->(start_date, end_date) {
    where(created_at: start_date.beginning_of_day..end_date.end_of_day) if start_date.present? && end_date.present?
  }

  def action_type_name
    I18n.t("activerecord.attributes.audit_log.action_types.#{action_type}", default: action_type.humanize)
  end

  def display_field_name
    return '' if field_name.blank?
    I18n.t("activerecord.attributes.ticket.#{field_name}", default: field_name.humanize)
  end

  def action_type_color
    case action_type
    when 'create_ticket', 'create_review' then 'bg-green-100 text-green-800 border-green-200'
    when 'update_review', 'update_efficiency' then 'bg-purple-100 text-purple-800 border-purple-200'
    when 'add_remark' then 'bg-gray-100 text-gray-800 border-gray-200'
    else 'bg-blue-100 text-blue-800 border-blue-200'
    end
  end
end
