class ServiceItem < ApplicationRecord
  has_many :appointment_service_items, dependent: :destroy
  has_many :appointments, through: :appointment_service_items
  has_many :waiting_lists, dependent: :nullify

  validates :code, presence: true, uniqueness: true
  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :duration_minutes, numericality: { greater_than: 0 }, allow_nil: true

  scope :active, -> { where(active: true) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }
  scope :dental_cleaning, -> { where("name LIKE ? OR category = ?", "%洁牙%", "cleaning") }
end
