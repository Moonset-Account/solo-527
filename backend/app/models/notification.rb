class Notification < ApplicationRecord
  belongs_to :user

  validates :title, presence: true, length: { maximum: 100 }
  validates :content, length: { maximum: 500 }
  validates :notification_type, presence: true

  scope :unread, -> { where(read: false) }
  scope :read, -> { where(read: true) }
  scope :by_type, ->(type) { where(notification_type: type) }
  scope :by_user, ->(user_id) { where(user_id: user_id) }
  scope :recent, -> { order(created_at: :desc) }

  def mark_as_read!
    update!(read: true, read_at: Time.current) unless read?
  end

  def self.mark_all_as_read!(user_id)
    where(user_id: user_id, read: false).update_all(read: true, read_at: Time.current)
  end

  def self.send_notification!(user, title, content, notification_type, metadata = {})
    create!(
      user: user,
      title: title,
      content: content,
      notification_type: notification_type,
      metadata: metadata
    )
  end
end
