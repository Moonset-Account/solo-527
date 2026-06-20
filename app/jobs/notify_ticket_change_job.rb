class NotifyTicketChangeJob < ApplicationJob
  queue_as :default

  def perform(ticket_id, user_id, action_type)
    @ticket = Ticket.find_by(id: ticket_id)
    @user = User.find_by(id: user_id)
    return unless @ticket && @user

    notify_submitter if @ticket.submitter && @ticket.submitter != @user
    notify_assignee if @ticket.assignee && @ticket.assignee != @user
    notify_executives if action_type.in?(%w[update_assignee update_department create_ticket])
  end

  private

  def notify_submitter
    Rails.logger.info "通知提交人 #{@ticket.submitter.name} (##{@ticket.id}): #{action_description}"
  end

  def notify_assignee
    Rails.logger.info "通知负责人 #{@ticket.assignee.name} (##{@ticket.id}): #{action_description}"
  end

  def notify_executives
    User.executive.find_each do |exec|
      Rails.logger.info "通知总经办 #{exec.name} (##{@ticket.id}): #{action_description}"
    end
  end

  def action_description
    I18n.t("activerecord.attributes.audit_log.actions.#{@action_type}", default: @action_type.humanize)
  end
end
