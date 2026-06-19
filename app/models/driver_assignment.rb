class DriverAssignment < ApplicationRecord
  belongs_to :vehicle
  belongs_to :old_driver, class_name: 'User'
  belongs_to :new_driver, class_name: 'User'
  belongs_to :reassigned_by, class_name: 'User', optional: true

  validates :vehicle_id, presence: true
  validates :old_driver_id, presence: true
  validates :new_driver_id, presence: true
  validates :reason, presence: true
  validates :reassigned_at, presence: true

  def handle_duration_seconds
    return nil unless created_at && reassigned_at

    (reassigned_at - created_at).to_i
  end
end
