class TeachingAid < ApplicationRecord
  include Ransackable
  has_many :teaching_aid_allocations, dependent: :destroy
  has_many :course_sessions, through: :teaching_aid_allocations

  validates :name, presence: true
  validates :total_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :available_quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validate :available_quantity_not_exceed_total

  scope :available, -> { where('available_quantity > 0') }
  scope :by_category, ->(category) { where(category: category) }

  def available?(quantity = 1)
    available_quantity >= quantity
  end

  def allocate(quantity)
    return false unless available?(quantity)
    decrement!(:available_quantity, quantity)
  end

  def return(quantity)
    new_available = available_quantity + quantity
    return false if new_available > total_quantity
    increment!(:available_quantity, quantity)
  end

  private

  def available_quantity_not_exceed_total
    return if available_quantity.blank? || total_quantity.blank?
    if available_quantity > total_quantity
      errors.add(:available_quantity, 'cannot exceed total quantity')
    end
  end
end
