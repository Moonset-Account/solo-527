class MaterialTransactionsController < ApplicationController
  before_action :require_admin!, only: [:create]

  def index
    @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
  end

  def create
    @material_transaction = MaterialTransaction.new(material_transaction_params)
    @material_transaction.operator = current_user
    if @material_transaction.save
      @material = @material_transaction.material
      adjust_quantity
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("material_#{@material.id}", partial: "materials/material", locals: { material: @material }) }
        format.html { redirect_to material_transactions_url, notice: "Transaction recorded." }
      end
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
