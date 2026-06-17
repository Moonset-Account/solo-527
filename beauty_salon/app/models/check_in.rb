class CheckIn < ApplicationRecord
  belongs_to :appointment, optional: true
  belongs_to :customer
  belongs_to :technician
  belongs_to :treatment
  belongs_to :treatment_card_item, optional: true

  validates :checked_in_at, presence: true

  enum :status, { checked_in: 0, in_service: 1, completed: 2, cancelled: 3 }

  after_create :consume_session

  private

  def consume_session
    return unless treatment_card_item
    treatment_card_item.consume!
  end
end
