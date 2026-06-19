class OverdueReview < ApplicationRecord
  belongs_to :visit_record
  belongs_to :reviewer, class_name: 'User', optional: true
  belongs_to :volunteer_service, optional: true

  validates :visit_record, :impact_scope, :responsible_person, :conclusion, :volunteer_service, presence: true

  after_create :ensure_overdue_status

  private

  def ensure_overdue_status
    if visit_record.may_mark_overdue?
      visit_record.mark_overdue!
    end
  end
end
