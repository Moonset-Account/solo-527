class OverdueVisitDetectionJob < ApplicationJob
  queue_as :default

  def perform
    VisitRecord.where(status: 'planned').where('visit_date < ?', Date.today).find_each do |record|
      record.mark_overdue! if record.may_mark_overdue?
    end
  end
end
