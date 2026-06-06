class Export < ApplicationRecord
  include Ransackable

  enum :status, { pending: 0, processing: 1, completed: 2, failed: 3 }
  enum :export_type, { bookings: 0, guide_schedule: 1, students: 2 }

  belongs_to :user

  validates :export_type, presence: true
  validates :status, presence: true

  scope :recent, -> { order(created_at: :desc) }
  scope :by_user, ->(user) { where(user: user) }

  def download_url
    return nil unless completed? && file_path.present?
    "/api/v1/exports/#{id}/download"
  end
end
