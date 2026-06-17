class TodoItem < ApplicationRecord
  belongs_to :assignee, polymorphic: true
  belongs_to :source, polymorphic: true, optional: true

  validates :title, presence: true

  enum :status, { pending: 0, in_progress: 1, completed: 2, dismissed: 3 }

  scope :pending_only, -> { where(status: :pending) }
  scope :recent, -> { order(created_at: :desc) }
  scope :by_category, ->(cat) { where(category: cat) if cat.present? }

  def self.create_from_urgent_notification!(notification)
    create!(
      assignee: notification.recipient,
      source: notification,
      title: notification.title,
      body: notification.body,
      category: notification.category,
      status: :pending,
      due_at: 24.hours.from_now
    )
  end
end
