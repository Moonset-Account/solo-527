class TicketsController < ApplicationController
  before_action :set_ticket, only: [:show, :edit, :update, :destroy, :audit, :update_status]

  def index
    @q = policy_scope(Ticket).ransack(params[:q])
    @tickets = @q.result.recent.page(params[:page]).per(20)
  end

  def show
    authorize @ticket
    @audit_logs = @ticket.audit_logs.recent.limit(50)
    @versions = @ticket.versions.reorder(created_at: :desc).limit(50)
  end

  def new
    @ticket = Ticket.new
    @ticket.submitter = current_user
    @ticket.assignee = current_user
    @ticket.department = current_user.department
    authorize @ticket
  end

  def edit
    authorize @ticket
  end

  def create
    @ticket = Ticket.new(ticket_params)
    @ticket.submitter = current_user
    @ticket.status ||= :pending
    @ticket.process_node ||= '需求提交'
    authorize @ticket

    if @ticket.save
      @ticket.create_audit_log(current_user, 'create_ticket', nil, nil, nil, '需求创建成功')
      NotifyTicketChangeJob.perform_later(@ticket.id, current_user.id, 'create_ticket')
      redirect_to @ticket, notice: '需求提交成功。'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    authorize @ticket
    old_attrs = @ticket.attributes.slice('status', 'assignee_id', 'department_id', 'process_node', 'priority', 'deadline', 'title', 'description')

    if @ticket.update(ticket_params)
      create_audit_logs_for_changes(old_attrs)
      NotifyTicketChangeJob.perform_later(@ticket.id, current_user.id, 'update_ticket')
      redirect_to @ticket, notice: '需求更新成功。'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def update_status
    authorize @ticket, :update_status?
    old_status = @ticket.status

    if @ticket.update(status: params[:status])
      action_type = 'update_status'
      if params[:status] == 'completed'
        @ticket.update(completed_at: Time.current)
      end
      @ticket.create_audit_log(current_user, action_type, 'status', old_status, @ticket.status)
      NotifyTicketChangeJob.perform_later(@ticket.id, current_user.id, action_type)
      redirect_to @ticket, notice: '状态更新成功。'
    else
      redirect_to @ticket, alert: '状态更新失败。'
    end
  end

  def destroy
    authorize @ticket
    @ticket.destroy
    redirect_to tickets_url, notice: '需求已删除。'
  end

  def audit
    authorize @ticket, :audit?
    @versions = @ticket.versions.includes(:item).reorder(created_at: :desc)
    @audit_logs = @ticket.audit_logs.includes(:user).recent
    @review_versions = @ticket.review_conclusion&.versions&.includes(:item)&.reorder(created_at: :desc) || []
  end

  private

  def set_ticket
    @ticket = Ticket.find(params[:id])
  end

  def ticket_params
    allowed = [:title, :description, :priority, :assignee_id, :department_id, :process_node, :deadline]
    allowed += [:status] if policy(@ticket || Ticket).update_status?
    params.require(:ticket).permit(allowed)
  end

  def create_audit_logs_for_changes(old_attrs)
    field_mapping = {
      'status' => 'update_status',
      'assignee_id' => 'update_assignee',
      'department_id' => 'update_department',
      'process_node' => 'update_process_node',
      'priority' => 'update_priority',
      'deadline' => 'update_deadline',
      'title' => 'update_title',
      'description' => 'update_description'
    }

    new_attrs = @ticket.attributes.slice(*old_attrs.keys)
    old_attrs.each do |field, old_val|
      new_val = new_attrs[field]
      next if old_val == new_val
      old_display = display_value(field, old_val)
      new_display = display_value(field, new_val)
      @ticket.create_audit_log(current_user, field_mapping[field], field, old_display, new_display)
    end
  end

  def display_value(field, val)
    case field
    when 'assignee_id'
      val.present? ? User.find_by(id: val)&.name : nil
    when 'department_id'
      val.present? ? Department.find_by(id: val)&.name : nil
    when 'status'
      Ticket.statuses.key(val) || val
    when 'priority'
      Ticket.priorities.key(val) || val
    else
      val
    end&.to_s
  end
end
