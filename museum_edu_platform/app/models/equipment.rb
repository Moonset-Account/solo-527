class Equipment < ApplicationRecord
  has_paper_trail

  enum :status, {
    available: 0,
    in_use: 1,
    maintenance: 2,
    retired: 3
  }, default: 'available'

  has_many :session_equipments, dependent: :destroy
  has_many :sessions, through: :session_equipments

  has_one_attached :photo

  validates :name, presence: true, uniqueness: true
  validates :category, presence: true
  validates :quantity, presence: true, numericality: { only_integer: true, greater_than_or_equal_to: 0 }

  validates :photo, content_type: ['image/png', 'image/jpeg'],
                    size: { less_than: 10.megabytes }

  scope :by_category, ->(category) { where(category: category) if category.present? }
  scope :available_for_booking, -> { where(status: :available) }
  scope :by_name, ->(name) { where('name LIKE ?', "%#{name}%") if name.present? }

  def available_quantity
    quantity - session_equipments.joins(:session)
      .where('sessions.start_at <= ? AND sessions.end_at >= ?', Time.current, Time.current)
      .where.not(sessions: { status: :cancelled })
      .sum(:quantity_allocated)
  end
end
