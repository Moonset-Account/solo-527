class User < ApplicationRecord
  devise :database_authenticatable, :registerable,
         :recoverable, :rememberable, :validatable

  belongs_to :department, optional: true
  has_many :submitted_tickets, class_name: 'Ticket', foreign_key: 'submitter_id', dependent: :restrict_with_error
  has_many :assigned_tickets, class_name: 'Ticket', foreign_key: 'assignee_id', dependent: :restrict_with_error
  has_many :review_conclusions, foreign_key: 'reviewer_id', dependent: :restrict_with_error
  has_many :audit_logs, dependent: :restrict_with_error

  enum :role, {
    user: 0,
    admin: 1,
    executive: 2
  }

  validates :name, presence: true
  validates :role, presence: true

  scope :ordered, -> { order(name: :asc) }
  scope :by_department, ->(dept_id) { where(department_id: dept_id) if dept_id.present? }

  def role_name
    I18n.t("activerecord.attributes.user.roles.#{role}", default: role.humanize)
  end

  def executive_or_admin?
    executive? || admin?
  end
end
