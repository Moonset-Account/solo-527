class EventRegistration < ApplicationRecord
  has_paper_trail

  belongs_to :user
  belongs_to :event
  has_many :check_ins, as: :checkinable, dependent: :destroy
  has_many :payments, as: :payable, dependent: :destroy
  has_many :results, dependent: :destroy

  scope :by_status, ->(status) { where(status: status) }
  scope :by_payment_status, ->(status) { where(payment_status: status) }
  scope :confirmed, -> { where(status: "confirmed") }
  scope :recent, -> { order(created_at: :desc) }

  validates :user_id, uniqueness: { scope: :event_id, message: "已经报名了该赛事" }
  validates :status, inclusion: { in: %w[pending confirmed cancelled disqualified] }
  validates :payment_status, inclusion: { in: %w[unpaid paid failed refunded] }

  def confirm!
    update!(status: "confirmed", registered_at: Time.current)
  end

  def cancel!
    update!(status: "cancelled")
  end

  def mark_paid!
    update!(payment_status: "paid")
    confirm! if pending?
  end

  def mark_payment_failed!(reason = nil)
    update!(payment_status: "failed")
  end

  def source_description
    "赛事报名: #{event.name} (#{status_text})"
  end

  def status_text
    case status
    when "pending" then "待确认"
    when "confirmed" then "已确认"
    when "cancelled" then "已取消"
    when "disqualified" then "取消资格"
    else status
    end
  end

  def pending?
    status == "pending"
  end

  def confirmed?
    status == "confirmed"
  end

  def paid?
    payment_status == "paid"
  end
end
