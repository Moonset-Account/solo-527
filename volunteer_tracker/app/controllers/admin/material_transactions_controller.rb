class Admin::MaterialTransactionsController < ApplicationController
  before_action :require_admin!

  def index
    @material_transaction ||= MaterialTransaction.new
    @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
  end

  def new
    @material_transaction = MaterialTransaction.new
    @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
    render :index
  end

  def create
    @material_transaction = MaterialTransaction.new(material_transaction_params)
    @material_transaction.operator = current_user
    if @material_transaction.save
      redirect_to admin_material_transactions_url, notice: "出入库记录已创建。"
    else
      @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
      render :index, status: :unprocessable_entity
    end
  end

  private

  def material_transaction_params
    params.require(:material_transaction).permit(:material_id, :transaction_type, :quantity, :recipient, :remark)
  end
end
