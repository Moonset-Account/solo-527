class Admin::TicketTypesController < ApplicationController
  before_action :require_login
  before_action :require_admin

  def index
    @ticket_types = TicketType.includes(:event, :inventory).recent
    @ticket_types = @ticket_types.where(event_id: params[:event_id]) if params[:event_id].present?
    @ticket_types = @ticket_types.where(status: params[:status]) if params[:status].present?
  end

  def show
    @ticket_type = TicketType.find(params[:id])
  end

  def new
    @ticket_type = TicketType.new
  end

  def create
    @ticket_type = TicketType.new(ticket_type_params)
    if @ticket_type.save
      @ticket_type.create_inventory!(total: params[:inventory_total] || 0, available: params[:inventory_total] || 0)
      redirect_to [:admin, @ticket_type], notice: "票种创建成功"
    else
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @ticket_type = TicketType.find(params[:id])
  end

  def update
    @ticket_type = TicketType.find(params[:id])
    if @ticket_type.update(ticket_type_params)
      redirect_to [:admin, @ticket_type], notice: "票种更新成功"
    else
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @ticket_type = TicketType.find(params[:id])
    @ticket_type.destroy
    redirect_to admin_ticket_types_path, notice: "票种已删除"
  end

  private

  def ticket_type_params
    params.require(:ticket_type).permit(:event_id, :name, :price, :description, :purchase_limit, :status)
  end
end
