class NotifyReviewJob < ApplicationJob
  queue_as :default

  def perform(review_id, user_id, action_type)
    @review = ReviewConclusion.find_by(id: review_id)
    @user = User.find_by(id: user_id)
    return unless @review && @user

    ticket = @review.ticket
    notify_ticket_stakeholders(ticket)
    notify_executives
  end

  private

  def notify_ticket_stakeholders(ticket)
    [ticket.submitter, ticket.assignee].uniq.compact.each do |stakeholder|
      next if stakeholder == @user
      Rails.logger.info "通知 #{stakeholder.name} (需求##{ticket.id}): 复盘结论有更新"
    end
  end

  def notify_executives
    User.executive.find_each do |exec|
      Rails.logger.info "通知总经办 #{exec.name}: 复盘结论更新 (需求##{@review.ticket.id})"
    end
  end
end
