class Kennel < ApplicationRecord
  has_many :boarding_reservations, dependent: :nullify
  has_many :safety_incidents, dependent: :nullify

  validates :name, presence: true, uniqueness: true
  validates :size_category, presence: true

  enum :status, { available: 0, occupied: 1, maintenance: 2 }

  scope :by_size, ->(size) { where(size_category: size) }
  scope :available_now, -> { where(status: :available) }

  def self.ransackable_attributes(auth_object = nil)
    %w[id name size_category daily_rate status notes created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[boarding_reservations safety_incidents]
  end

  def current_pet
    reservation = boarding_reservations.where(status: :checked_in).order(check_in_at: :desc).first
    reservation&.pet
  end

  def size_display
    I18n.t("kennel.sizes.#{size_category}", default: size_category.humanize)
  end
end
