class MaterialPackage < ApplicationRecord
  enum status: { active: 0, low_stock: 1, out_of_stock: 2, discontinued: 3 }

  has_many :course_sessions, dependent: :nullify
  has_many :bookings, dependent: :nullify

  validates :name, presence: true, length: { maximum: 100 }
  validates :sku, presence: true, uniqueness: true, length: { maximum: 50 }
  validates :cost_price, numericality: { greater_than_or_equal_to: 0 }
  validates :sale_price, numericality: { greater_than_or_equal_to: 0 }
  validates :stock_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :reserved_quantity, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :safety_stock, numericality: { only_integer: true, greater_than_or_equal_to: 0 }
  validates :status, presence: true

  scope :available, -> { where(status: [:active, :low_stock]) }
  scope :out_of_stock_items, -> { where(status: :out_of_stock) }
  scope :low_stock_items, -> { where('stock_quantity - reserved_quantity <= safety_stock') }

  before_save :update_status

  def available_quantity
    stock_quantity - reserved_quantity
  end

  def can_sell?(quantity = 1)
    available_quantity >= quantity && active?
  end

  def reserve!(quantity = 1)
    raise '库存不足' unless can_sell?(quantity)
    decrement!(:stock_quantity, quantity)
    increment!(:reserved_quantity, quantity)
  end

  def release!(quantity = 1)
    decrement!(:reserved_quantity, quantity)
    increment!(:stock_quantity, quantity)
  end

  def deduct_reserved!(quantity = 1)
    decrement!(:reserved_quantity, quantity)
  end

  private

  def update_status
    return if discontinued?
    if available_quantity <= 0
      self.status = :out_of_stock
    elsif available_quantity <= safety_stock
      self.status = :low_stock
    else
      self.status = :active
    end
  end
end
