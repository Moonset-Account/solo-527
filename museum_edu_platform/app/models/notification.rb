class Notification < ApplicationRecord
  belongs_to :user

  validates :title, presence: true
  validates :content, presence: true
  validates :notification_type, presence: true

  scope :unread, -> { where(read_at: nil) }
  scope :read, -> { where.not(read_at: nil) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_type, ->(type) { where(notification_type: type) if type.present? }

  def read?
    read_at.present?
  end

  def unread?
    read_at.nil?
  end

  def mark_as_read!
    update(read_at: Time.current) if unread?
  end

  def related_object
    return nil unless related_object_type && related_object_id

    related_object_type.safe_constantize&.find_by(id: related_object_id)
  end

  def related_object=(object)
    self.related_object_type = object.class.name
    self.related_object_id = object.id
  end
end
