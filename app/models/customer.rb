class Customer < ApplicationRecord
  has_many :waiting_lists, dependent: :destroy
  has_many :appointments, dependent: :destroy
  has_many :refund_records, through: :appointments

  validates :name, presence: true
  validates :phone, presence: true, uniqueness: true

  scope :vip, -> { where(vip: true) }
  scope :with_no_shows, -> { where("no_show_count > 0") }

  def increment_no_show!
    increment!(:no_show_count)
  end

  def active_waiting_list_entries
    waiting_lists.where(status: "waiting").order(:joined_at)
  end

  def recent_appointments(limit = 10)
    appointments.order(created_at: :desc).limit(limit)
  end
end
