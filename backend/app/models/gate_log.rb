class GateLog < ApplicationRecord
  belongs_to :pass, optional: true
  belongs_to :person, optional: true
  belongs_to :vehicle, optional: true
  belongs_to :operator, class_name: 'User', optional: true

  validates :gate_name, presence: true
  validates :action, presence: true, inclusion: { in: %w[in out] }
  validates :logged_at, presence: true
  validates :result, presence: true, inclusion: { in: %w[allowed denied] }

  scope :by_gate, ->(gate) { where(gate_name: gate) }
  scope :by_date, ->(date) { where('DATE(logged_at) = ?', date) }
  scope :recent, -> { order(logged_at: :desc) }

  ACTION_NAMES = {
    'in' => '进场',
    'out' => '出场'
  }.freeze

  RESULT_NAMES = {
    'allowed' => '放行',
    'denied' => '拦截'
  }.freeze

  def action_name
    ACTION_NAMES[action] || action
  end

  def result_name
    RESULT_NAMES[result] || result
  end

  def self.today_stats(gate_name = nil)
    scope = all
    scope = scope.where(gate_name: gate_name) if gate_name.present?
    scope = scope.where('DATE(logged_at) = ?', Date.current)
    {
      total: scope.count,
      allowed: scope.where(result: 'allowed').count,
      denied: scope.where(result: 'denied').count,
      in_count: scope.where(action: 'in', result: 'allowed').count,
      out_count: scope.where(action: 'out', result: 'allowed').count
    }
  end
end
