class AuditLog < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :entity, polymorphic: true, optional: true

  validates :action_type, presence: true
  validates :entity_type, presence: true
  validates :entity_id, presence: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_action, ->(action_type) { where(action_type: action_type) }
  scope :by_entity, ->(entity_type, entity_id = nil) do
    if entity_id
      where(entity_type: entity_type, entity_id: entity_id)
    else
      where(entity_type: entity_type)
    end
  end
  scope :by_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }
  scope :latest_first, -> { order(created_at: :desc) }
  scope :quality_failures, -> { where(action_type: ['质检不合格', '质检返工']) }
  scope :exports, -> { where(action_type: '数据导出') }

  def parsed_details
    return {} unless details.present?
    JSON.parse(details) rescue {}
  end

  def action_type_name
    I18n.t("audit_log.action_types.#{action_type}", default: action_type)
  end

  def entity_display
    if entity
      entity.try(:display_name) || entity.try(:name) || entity.try(:order_no) || "#{entity_type} ##{entity_id}"
    else
      "#{entity_type} ##{entity_id}"
    end
  end
end
