class MaterialTransaction < ApplicationRecord
  belongs_to :material
  belongs_to :operator, class_name: 'User', optional: true

  validates :material, :transaction_type, :quantity, presence: true
  validates :quantity, numericality: { greater_than: 0 }
  validates :transaction_type, inclusion: { in: %w[in out] }

  after_create :update_material_quantity

  private

  def update_material_quantity
    material.update_column(:quantity, material.current_quantity)
  end
end
