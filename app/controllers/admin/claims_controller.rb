class Admin::ClaimsController < Admin::BaseController
  def index
    @q = policy_scope(Claim).ransack(params[:q])
    @claims = @q.result.includes(:vehicle, :driver, :handler).order(created_at: :desc).page(params[:page]).per(20)
    authorize @claims
  end

  def show
    @claim = Claim.find(params[:id])
    authorize @claim
  end

  def handle
    @claim = Claim.find(params[:id])
    authorize @claim

    @claim.handler = current_user
    @claim.handled_at = Time.current
    @claim.status = :processing

    if @claim.save
      OperationLog.log(current_user, 'handle_claim', @claim)
      redirect_to [:admin, @claim], notice: '工单已受理。'
    else
      redirect_to [:admin, @claim], alert: '操作失败。'
    end
  end

  def approve
    @claim = Claim.find(params[:id])
    authorize @claim

    @claim.status = :approved
    @claim.approved_at = Time.current

    if @claim.save
      OperationLog.log(current_user, 'approve_claim', @claim)
      redirect_to [:admin, @claim], notice: '工单已批准。'
    else
      redirect_to [:admin, @claim], alert: '操作失败。'
    end
  end

  def reject
    @claim = Claim.find(params[:id])
    authorize @claim

    @claim.status = :rejected
    @claim.rejected_at = Time.current
    @claim.reject_reason = params[:reject_reason]

    if @claim.save
      OperationLog.log(current_user, 'reject_claim', @claim)
      redirect_to [:admin, @claim], notice: '工单已驳回。'
    else
      redirect_to [:admin, @claim], alert: '操作失败。'
    end
  end

  private

  def claim_params
    params.require(:claim).permit(:vehicle_id, :driver_id, :claim_type, :amount, :description,
                                  :status, :handler_id, :reported_at, :handled_at, :settlement_id)
  end
end
