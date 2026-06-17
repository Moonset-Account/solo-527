class ApiFailureLog < ApplicationRecord
  validates :endpoint, presence: true
  validates :method, presence: true

  enum :status, { pending: 0, retrying: 1, resolved: 2, failed: 3 }

  scope :pending_retry, -> { where(status: [:pending, :retrying]).where("retry_count < max_retries") }
  scope :recent, -> { order(created_at: :desc) }

  def can_retry?
    retry_count < max_retries
  end

  def retry!
    return false unless can_retry?
    update!(status: :retrying, retried: true, retry_count: retry_count + 1)
    ApiRetryJob.perform_later(self)
  end

  def resolve!
    update!(status: :resolved)
  end

  def fail_permanently!
    update!(status: :failed)
  end

  def add_note!(note)
    update!(notes: [notes, note].compact_blank.join("\n"))
  end
end
