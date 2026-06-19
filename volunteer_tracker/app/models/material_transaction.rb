class MaterialTransaction < ApplicationRecord
  belongs_to :material
  belongs_to :operator, class_name: 'User', optional: true

  validates :material, :transaction_type, :quantity, presence: true
  validates :quantity, numericality: { greater_than: 0 }
  validates :transaction_type, inclusion: { in: %w[in out] }
end
