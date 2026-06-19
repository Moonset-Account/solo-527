class OverdueReview < ApplicationRecord
  belongs_to :visit_record
  belongs_to :reviewer, class_name: 'User', optional: true

  validates :visit_record, :impact_scope, :responsible_person, :conclusion, presence: true

  after_create :update_visit_record_status

  private

  def update_visit_record_status
    visit_record.mark_overdue! if visit_record.may_mark_overdue?
  end
end
