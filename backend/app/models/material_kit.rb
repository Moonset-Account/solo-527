class MaterialKit < ApplicationRecord
  include Audited

  has_many :courses, dependent: :nullify
  has_many :enrollments, dependent: :nullify

  validates :name, presence: true
  validates :stock, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :warning_threshold, presence: true, numericality: { greater_than_or_equal_to: 0 }
  validates :status, presence: true, inclusion: { in: %w[in_stock low_stock out_of_stock] }

  scope :active, -> { where.not(status: 'out_of_stock') }
  scope :low_stock, -> { where('stock <= warning_threshold') }
  scope :out_of_stock, -> { where(status: 'out_of_stock') }

  before_save :update_status_based_on_stock

  def update_status_based_on_stock
    if stock.zero?
      self.status = 'out_of_stock'
    elsif stock <= warning_threshold
      self.status = 'low_stock'
    else
      self.status = 'in_stock'
    end
  end

  def sufficient_stock?(quantity = 1)
    stock >= quantity
  end

  def deduct_stock!(quantity = 1)
    raise 'Insufficient stock' unless sufficient_stock?(quantity)

    transaction do
      decrement!(:stock, quantity)
      update_status_based_on_stock
      save! if changed?
    end
  end

  def restock!(quantity)
    transaction do
      increment!(:stock, quantity)
      update_status_based_on_stock
      save! if changed?
    end
  end
end
