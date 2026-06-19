class ClaimsController < ApplicationController
  def index
    @q = policy_scope(Claim).ransack(params[:q])
    @claims = @q.result.includes(:vehicle, :driver).order(created_at: :desc).page(params[:page]).per(20)
    authorize @claims
  end

  def show
    @claim = Claim.find(params[:id])
    authorize @claim
  end

  def new
    @claim = Claim.new
    authorize @claim
  end

  def create
    @claim = Claim.new(claim_params)
    @claim.driver = current_user
    authorize @claim

    if @claim.save
      OperationLog.log(current_user, 'create_claim', @claim)
      redirect_to @claim, notice: '赔付工单创建成功。'
    else
      render :new
    end
  end

  private

  def claim_params
    params.require(:claim).permit(:vehicle_id, :claim_type, :amount, :description, :reported_at, :evidence)
  end
end
