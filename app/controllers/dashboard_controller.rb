class DashboardController < ApplicationController
  def index
    @tickets = policy_scope(Ticket).recent.limit(10)
    @my_pending = policy_scope(Ticket).by_assignee(current_user.id).pending.count
    @my_in_progress = policy_scope(Ticket).by_assignee(current_user.id).in_progress.count
    @my_completed = policy_scope(Ticket).by_assignee(current_user.id).completed.count
    @my_exception = policy_scope(Ticket).by_assignee(current_user.id).exception.count
    @total_pending = policy_scope(Ticket).pending.count
    @total_in_progress = policy_scope(Ticket).in_progress.count
    @total_completed = policy_scope(Ticket).completed.count
    @total_exception = policy_scope(Ticket).exception.count
    @overdue_count = policy_scope(Ticket).overdue.count
  end
end
