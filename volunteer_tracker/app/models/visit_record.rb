class VisitRecord < ApplicationRecord
  include AASM

  belongs_to :volunteer, class_name: 'User'
  has_one :overdue_review, dependent: :destroy
  has_many :tracking_reminders, as: :trackable, dependent: :destroy

  validates :volunteer, :visit_date, :target_name, presence: true

  def self.ransackable_attributes(auth_object = nil)
    %w[visit_date target_name target_address target_contact status purpose result next_action volunteer_id created_at updated_at]
  end

  def self.ransackable_associations(auth_object = nil)
    %w[volunteer overdue_review tracking_reminders]
  end

  aasm column: :status do
    state :planned, initial: true
    state :in_progress
    state :completed
    state :overdue
    state :cancelled

    event :start_visit do
      transitions from: :planned, to: :in_progress
    end

    event :complete do
      transitions from: :in_progress, to: :completed
    end

    event :mark_overdue do
      after do
        TrackingReminder.create!(
          trackable: self,
          reminder_type: 'overdue_follow_up',
          reminder_date: Date.today + 3.days,
          message: "Overdue follow-up required for visit to #{target_name}"
        )
      end
      transitions from: :planned, to: :overdue
      transitions from: :in_progress, to: :overdue
    end

    event :cancel do
      transitions from: :planned, to: :cancelled
      transitions from: :in_progress, to: :cancelled
    end
  end

  def overdue?
    status == 'overdue'
  end

  def next_action_label
    case status
    when 'planned' then 'Start Visit'
    when 'in_progress' then 'Complete Visit'
    when 'overdue' then 'Review Overdue'
    when 'completed' then 'View Result'
    else nil
    end
  end
end
