class AuditLog < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :auditable, polymorphic: true, optional: true

  validates :action, presence: true
  validates :auditable_type, presence: true
  validates :auditable_id, presence: true

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_auditable, ->(auditable_type, auditable_id) { where(auditable_type: auditable_type, auditable_id: auditable_id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :in_date_range, ->(start_date, end_date) { where(created_at: start_date.beginning_of_day..end_date.end_of_day) }

  def self.log!(user, action, auditable, old_values = {}, new_values = {}, options = {})
    create!(
      user: user,
      action: action,
      auditable: auditable,
      old_values: old_values,
      new_values: new_values,
      ip_address: options[:ip_address],
      user_agent: options[:user_agent],
      comment: options[:comment]
    )
  end
end
