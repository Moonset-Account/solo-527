class Admin::SettlementsController < Admin::BaseController
  def index
    @q = policy_scope(Settlement).ransack(params[:q])
    @settlements = @q.result.includes(:vehicle, :driver).order(created_at: :desc).page(params[:page]).per(20)
    authorize @settlements
  end

  def show
    @settlement = Settlement.find(params[:id])
    authorize @settlement
  end

  def new
    @settlement = Settlement.new
    authorize @settlement
  end

  def create
    @settlement = Settlement.new(settlement_params)
    authorize @settlement

    if @settlement.save
      OperationLog.log(current_user, 'create_settlement', @settlement)
      redirect_to [:admin, @settlement], notice: '结算单创建成功。'
    else
      render :new
    end
  end

  def edit
    @settlement = Settlement.find(params[:id])
    authorize @settlement
  end

  def update
    @settlement = Settlement.find(params[:id])
    authorize @settlement

    if @settlement.update(settlement_params)
      OperationLog.log(current_user, 'update_settlement', @settlement)
      redirect_to [:admin, @settlement], notice: '结算单更新成功。'
    else
      render :edit
    end
  end

  def destroy
    @settlement = Settlement.find(params[:id])
    authorize @settlement

    @settlement.destroy
    OperationLog.log(current_user, 'destroy_settlement', @settlement)
    redirect_to admin_settlements_path, notice: '结算单已删除。'
  end

  def generate
    @settlement = Settlement.find(params[:id])
    authorize @settlement

    @settlement.calculate_total
    @settlement.status = :pending

    if @settlement.save
      OperationLog.log(current_user, 'generate_settlement', @settlement)
      redirect_to [:admin, @settlement], notice: '结算单生成成功。'
    else
      redirect_to [:admin, @settlement], alert: '结算单生成失败。'
    end
  end

  def approve
    @settlement = Settlement.find(params[:id])
    authorize @settlement

    if @settlement.pending?
      @settlement.status = :approved
      @settlement.save
      OperationLog.log(current_user, 'approve_settlement', @settlement)
      redirect_to [:admin, @settlement], notice: '结算单已审批通过。'
    else
      redirect_to [:admin, @settlement], alert: '结算单当前状态无法审批。'
    end
  end

  def pay
    @settlement = Settlement.find(params[:id])
    authorize @settlement

    if @settlement.approved?
      @settlement.status = :paid
      @settlement.paid_at = Time.current
      @settlement.save
      OperationLog.log(current_user, 'pay_settlement', @settlement)
      redirect_to [:admin, @settlement], notice: '结算单已标记支付。'
    else
      redirect_to [:admin, @settlement], alert: '结算单当前状态无法支付。'
    end
  end

  private

  def settlement_params
    params.require(:settlement).permit(:vehicle_id, :driver_id, :captain_id, :start_date, :end_date,
                                       :base_fee, :bonus_amount, :deduction_amount, :total_amount,
                                       :status, :remark)
  end
end
