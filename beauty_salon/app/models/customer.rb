class Customer < ApplicationRecord
  has_many :treatment_cards, dependent: :destroy
  has_many :appointments, dependent: :destroy
  has_many :check_ins, dependent: :destroy

  validates :name, presence: true
  validates :phone, presence: true, uniqueness: true

  scope :search, ->(keyword) { where("name ILIKE ? OR phone ILIKE ?", "%#{keyword}%", "%#{keyword}%") }

  def active_treatment_cards
    treatment_cards.where(status: :active)
  end
end
