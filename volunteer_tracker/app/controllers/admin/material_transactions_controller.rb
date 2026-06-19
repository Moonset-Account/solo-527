class Admin::MaterialTransactionsController < ApplicationController
  before_action :require_admin!

  def index
    @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
  end

  def create
    @material_transaction = MaterialTransaction.new(material_transaction_params)
    @material_transaction.operator = current_user
    if @material_transaction.save
      @material = @material_transaction.material
      adjust_quantity
      redirect_to admin_material_transactions_url, notice: "Transaction recorded."
    else
      render :new, status: :unprocessable_entity
    end
  end

  private

  def material_transaction_params
    params.require(:material_transaction).permit(:material_id, :transaction_type, :quantity, :recipient, :remark)
  end

  def adjust_quantity
    delta = @material_transaction.transaction_type == "in" ? @material_transaction.quantity : -@material_transaction.quantity
    @material.update!(quantity: @material.quantity + delta)
  end
end
