class WaitingListChangeLog < ApplicationRecord
  belongs_to :waiting_list
  belongs_to :appointment, optional: true

  validates :waiting_list_id, presence: true
  validates :change_type, presence: true
  validates :changed_at, presence: true

  scope :for_waiting_list, ->(wl_id) { where(waiting_list_id: wl_id) }
  scope :by_change_type, ->(type) { where(change_type: type) if type.present? }
  scope :recent, -> { order(changed_at: :desc) }
  scope :on_date, ->(date) { where("DATE(changed_at) = ?", date) }
end
