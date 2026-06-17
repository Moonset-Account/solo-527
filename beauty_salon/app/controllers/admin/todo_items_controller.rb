class Admin::TodoItemsController < ApplicationController
  layout "admin"

  before_action :set_todo_item, only: [:show, :update, :dismiss]

  def index
    @todo_items = TodoItem.includes(:assignee, :source).recent
    @todo_items = @todo_items.by_category(params[:category]) if params[:category].present?
    @todo_items = @todo_items.where(status: params[:status]) if params[:status].present?
  end

  def show
  end

  def update
    if @todo_item.update(todo_item_params)
      redirect_to admin_todo_items_path, notice: "待办已更新"
    else
      render :show, status: :unprocessable_content
    end
  end

  def dismiss
    @todo_item.update!(status: :dismissed)
    redirect_to admin_todo_items_path, notice: "待办已忽略"
  end

  private

  def set_todo_item
    @todo_item = TodoItem.find(params[:id])
  end

  def todo_item_params
    params.require(:todo_item).permit(:status, :title, :body)
  end
end
