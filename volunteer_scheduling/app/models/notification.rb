class Notification < ApplicationRecord
  belongs_to :recipient, class_name: "User"
  belongs_to :notifiable, polymorphic: true, optional: true

  validates :title, presence: true
  validates :notification_type, presence: true

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }

  def mark_as_read!
    update!(read: true, read_at: Time.current)
  end
end
