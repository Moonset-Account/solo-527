class BookingStudent < ApplicationRecord
  include Ransackable
  belongs_to :booking
  belongs_to :student
  belongs_to :checked_in_by, class_name: 'User', foreign_key: 'checked_in_by', optional: true

  validates :booking_id, uniqueness: { scope: :student_id }

  scope :checked_in, -> { where(attended: true) }
  scope :not_checked_in, -> { where(attended: [false, nil]) }

  def check_in!(user)
    update!(attended: true, checked_in_at: Time.current, checked_in_by: user)
  end

  def undo_check_in!
    update!(attended: false, checked_in_at: nil, checked_in_by: nil)
  end
end
