class Service < ApplicationRecord
  has_many :training_records, dependent: :nullify

  validates :name, :duration_minutes, :price, :category, presence: true
  validates :duration_minutes, numericality: { greater_than: 0 }
  validates :price, numericality: { greater_than_or_equal_to: 0 }

  scope :active, -> { where(is_active: true) }
  scope :by_category, ->(category) { where(category:) }

  def self.ransackable_attributes(auth_object = nil)
    %w[id name category duration_minutes price is_active description created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[training_records]
  end

  CATEGORIES = %w[boarding training grooming medical daycare].freeze

  def category_display
    I18n.t("services.categories.#{category}", default: category.humanize)
  end

  def formatted_price
    "¥#{sprintf('%.2f', price)}"
  end

  def formatted_duration
    if duration_minutes >= 60
      hours = duration_minutes / 60
      mins = duration_minutes % 60
      mins > 0 ? "#{hours}小时#{mins}分钟" : "#{hours}小时"
    else
      "#{duration_minutes}分钟"
    end
  end
end
