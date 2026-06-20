class VenueBooking < ApplicationRecord
  has_paper_trail

  belongs_to :venue
  belongs_to :user
  belongs_to :bookable, polymorphic: true, optional: true

  scope :by_status, ->(status) { where(status: status) }
  scope :confirmed, -> { where(status: "confirmed") }
  scope :upcoming, -> { where("start_time >= ?", Time.current) }
  scope :by_date, ->(date) { where("DATE(start_time) = ?", date) }

  validates :start_time, presence: true
  validates :end_time, presence: true
  validates :status, inclusion: { in: %w[pending confirmed cancelled completed] }
  validate :no_overlapping_bookings
  validate :end_time_after_start_time

  def source_description
    desc = "场地预约: #{venue.name}"
    if bookable.present?
      desc += " (来源: #{bookable.is_a?(Course) ? "课程: #{bookable.name}" : "赛事: #{bookable.name}"})"
    end
    desc
  end

  def confirm!
    update!(status: "confirmed")
  end

  def cancel!
    update!(status: "cancelled")
  end

  def completed!
    update!(status: "completed")
  end

  private

  def no_overlapping_bookings
    return if cancelled?
    return unless venue&.available?(start_time, end_time)

    overlaps = venue.venue_bookings
      .where(status: "confirmed")
      .where.not(id: id)
      .where("start_time < ? AND end_time > ?", end_time, start_time)

    if overlaps.exists?
      errors.add(:base, "该时间段已有预约")
    end
  end

  def end_time_after_start_time
    if end_time <= start_time
      errors.add(:end_time, "必须晚于开始时间")
    end
  end

  def cancelled?
    status == "cancelled"
  end
end
