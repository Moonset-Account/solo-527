class ErrorLog < ApplicationRecord
  belongs_to :user, optional: true

  validates :level, presence: true, inclusion: { in: %w[debug info warning error fatal] }

  scope :by_level, ->(level) { where(level: level) }
  scope :recent, -> { order(created_at: :desc) }
  scope :last_24h, -> { where('created_at >= ?', 24.hours.ago) }

  LEVEL_NAMES = {
    'debug' => '调试',
    'info' => '信息',
    'warning' => '警告',
    'error' => '错误',
    'fatal' => '致命'
  }.freeze

  def level_name
    LEVEL_NAMES[level] || level
  end

  def self.log(level, message, options = {})
    create!(
      level: level,
      message: message,
      controller: options[:controller],
      action: options[:action],
      error_class: options[:error_class],
      backtrace: options[:backtrace]&.join("\n"),
      request_info: options[:request_info]&.to_json,
      user: options[:user],
      session_id: options[:session_id]
    )
  end
end
