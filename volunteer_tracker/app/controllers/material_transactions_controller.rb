class MaterialTransactionsController < ApplicationController
  before_action :require_admin!, only: [:create]

  def index
    @material_transactions = MaterialTransaction.includes(:material, :operator).order(created_at: :desc)
  end

  def create
    @material_transaction = MaterialTransaction.new(material_transaction_params)
    @material_transaction.operator = current_user
    if @material_transaction.save
      respond_to do |format|
        format.turbo_stream { render turbo_stream: turbo_stream.replace("material_#{@material_transaction.material_id}", partial: "materials/material", locals: { material: @material_transaction.material.reload }) }
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
end
