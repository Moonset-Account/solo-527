class Pet < ApplicationRecord
  has_many :boarding_reservations, dependent: :destroy
  has_many :health_records, dependent: :destroy
  has_many :training_records, dependent: :destroy
  has_many :safety_incidents, dependent: :destroy
  has_many :notifications, as: :notifiable, dependent: :destroy

  validates :name, :species, :owner_name, :owner_phone, presence: true

  scope :active, -> { where(active: true) }
  scope :by_species, ->(species) { where(species:) }

  def self.ransackable_attributes(auth_object = nil)
    %w[id name species breed age gender owner_name owner_phone active medical_history special_needs created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[boarding_reservations health_records training_records safety_incidents]
  end

  def current_reservation
    boarding_reservations.where(status: :checked_in).order(check_in_at: :desc).first
  end

  def recent_health_records(limit = 5)
    health_records.order(recorded_at: :desc).limit(limit)
  end

  def latest_health_record
    health_records.order(recorded_at: :desc).first
  end
end
