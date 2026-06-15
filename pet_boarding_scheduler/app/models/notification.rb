class Notification < ApplicationRecord
  include ActionView::RecordIdentifier

  belongs_to :notifiable, polymorphic: true, optional: true

  validates :title, :notification_type, presence: true

  scope :unread, -> { where(is_read: false) }
  scope :read, -> { where(is_read: true) }
  scope :recent, ->(limit = 20) { order(created_at: :desc).limit(limit) }
  scope :by_type, ->(type) { where(notification_type: type) }

  TYPES = %w[health training safety reservation system].freeze

  after_create_commit :broadcast_to_dashboard
  after_update_commit :broadcast_update, if: :saved_change_to_is_read?

  def mark_as_read!
    update!(is_read: true, read_at: Time.current)
  end

  def type_display
    I18n.t("notifications.types.#{notification_type}", default: notification_type.humanize)
  end

  def self.create_for_notifiable(notifiable, title, content, type)
    create!(
      notifiable:,
      title:,
      content:,
      notification_type: type
    )
  end

  private

  def broadcast_to_dashboard
    Turbo::StreamsChannel.broadcast_prepend_to(
      "notifications",
      target: "notifications-list",
      partial: "admin/notifications/notification_item",
      locals: { notification: self }
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "notifications",
      target: "unread-count",
      html: unread_count_badge
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "dashboard_updates",
      target: "unread-notifications-stat",
      html: Notification.unread.count
    )
  end

  def broadcast_update
    Turbo::StreamsChannel.broadcast_remove_to(
      "notifications",
      target: dom_id(self)
    )

    Turbo::StreamsChannel.broadcast_replace_to(
      "notifications",
      target: "unread-count",
      html: unread_count_badge
    )
  end

  def unread_count_badge
    count = Notification.unread.count
    return "" unless count > 0

    <<~HTML.html_safe
      <span id="unread-count" class="ml-auto bg-red-500 text-white text-xs px-2 py-0.5 rounded-full">
        #{count}
      </span>
    HTML
  end
end
