class OperationLog < ApplicationRecord
  belongs_to :user, optional: true
  belongs_to :target, polymorphic: true, optional: true

  serialize :details, JSON

  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :by_action, ->(action) { where(action: action) }
  scope :by_target, ->(target) { where(target_type: target.class.name, target_id: target.id) }
  scope :recent, -> { order(created_at: :desc) }
  scope :in_time_range, ->(start_time, end_time) { where(created_at: start_time..end_time) }

  def self.log(user, action, target = nil, details = {})
    create!(
      user: user,
      action: action,
      target: target,
      details: details
    )
  end
end
