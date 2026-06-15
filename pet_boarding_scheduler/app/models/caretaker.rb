class Caretaker < ApplicationRecord
  has_many :boarding_reservations, dependent: :nullify
  has_many :health_records, dependent: :nullify
  has_many :training_records, dependent: :nullify
  has_many :safety_incidents, dependent: :nullify

  validates :name, presence: true

  scope :active, -> { where(active: true) }

  def self.ransackable_attributes(auth_object = nil)
    %w[id name phone email active max_pets_capacity specialty notes created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[boarding_reservations health_records training_records safety_incidents]
  end

  def current_pets_count
    boarding_reservations.where(status: :checked_in).count
  end

  def available?
    current_pets_count < max_pets_capacity
  end

  def weekly_training_count
    training_records.where(training_date: 1.week.ago..Date.today).count
  end

  def monthly_boarding_count
    boarding_reservations.where(status: :completed, check_out_at: 1.month.ago..Time.current).count
  end
end
