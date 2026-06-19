class Material < ApplicationRecord
  has_many :material_transactions, dependent: :destroy

  validates :name, :category, :unit, presence: true

  def current_quantity
    in_total = material_transactions.where(transaction_type: 'in').sum(:quantity)
    out_total = material_transactions.where(transaction_type: 'out').sum(:quantity)
    in_total - out_total
  end

  def low_stock?
    threshold.present? && current_quantity <= threshold
  end

  def below_threshold?
    threshold.present? && current_quantity < threshold
  end
end
