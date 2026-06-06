class TeachingAidAllocation < ApplicationRecord
  include Ransackable
  belongs_to :teaching_aid
  belongs_to :course_session
  belongs_to :allocated_by, class_name: 'User', foreign_key: 'allocated_by', optional: true

  validates :teaching_aid, presence: true
  validates :course_session, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than: 0 }
  validate :sufficient_available_quantity, on: :create

  scope :active, -> { where(returned_at: nil) }
  scope :returned, -> { where.not(returned_at: nil) }

  def return!(user = nil)
    return false if returned?
    transaction do
      teaching_aid.return(quantity)
      update!(returned_at: Time.current)
    end
    true
  rescue ActiveRecord::RecordInvalid
    false
  end

  def returned?
    returned_at.present?
  end

  private

  def sufficient_available_quantity
    return if teaching_aid.blank?
    unless teaching_aid.available?(quantity)
      errors.add(:quantity, "exceeds available quantity (#{teaching_aid.available_quantity} available)")
    end
  end
end
