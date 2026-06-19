class VolunteerService < ApplicationRecord
  include AASM

  has_many :volunteer_service_assignments, dependent: :destroy
  has_many :users, through: :volunteer_service_assignments
  has_many :overdue_reviews, dependent: :nullify

  validates :title, :category, presence: true

  def self.ransackable_attributes(auth_object = nil)
    %w[title description category status start_date end_date created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[users volunteer_service_assignments]
  end

  aasm column: :status do
    state :draft, initial: true
    state :active
    state :paused
    state :completed

    event :activate do
      transitions from: :draft, to: :active
    end

    event :pause do
      transitions from: :active, to: :paused
    end

    event :resume do
      transitions from: :paused, to: :active
    end

    event :complete do
      transitions from: :active, to: :completed
      transitions from: :paused, to: :completed
    end
  end

  def status_badge_color
    case status
    when 'draft' then 'gray'
    when 'active' then 'green'
    when 'paused' then 'yellow'
    when 'completed' then 'blue'
    else 'gray'
    end
  end
end
