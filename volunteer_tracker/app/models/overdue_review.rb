class OverdueReview < ApplicationRecord
  belongs_to :visit_record
  belongs_to :reviewer, class_name: 'User', optional: true

  validates :visit_record, :impact_scope, :responsible_person, :conclusion, presence: true

  after_create :link_conclusion_to_service

  private

  def link_conclusion_to_service
    if visit_record.may_mark_overdue?
      visit_record.mark_overdue!
    end
  end
end
