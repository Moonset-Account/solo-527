class Treatment < ApplicationRecord
  has_many :treatment_card_items, dependent: :destroy
  has_many :appointments, dependent: :nullify
  has_many :check_ins, dependent: :nullify
  has_many :price_histories, dependent: :destroy
  has_many :consumable_rules, dependent: :destroy

  validates :name, presence: true
  validates :price, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :duration, presence: true, numericality: { greater_than: 0 }

  scope :active_only, -> { where(active: true) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }

  enum :category, { facial: "facial", body: "body", hair: "hair", nail: "nail", other: "other" }

  after_update :log_price_change, if: :saved_change_to_price?

  private

  def log_price_change
    PriceHistory.create!(
      treatment: self,
      old_price: price_before_last_save,
      new_price: price,
      changed_by_type: "System",
      changed_by_id: nil,
      changed_at: Time.current
    )
  end
end
