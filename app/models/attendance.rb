class Attendance < ApplicationRecord
  belongs_to :registration

  validates :checked_in_by, presence: true, if: :checked_in_at?

  scope :attended, -> { where(attended: true) }
  scope :by_date, ->(date) { where(checked_in_at: date.beginning_of_day..date.end_of_day) }
  scope :recent, -> { order(checked_in_at: :desc) }
end
