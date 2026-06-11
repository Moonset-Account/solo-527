class WaitingListRulesController < ApplicationController
  before_action :set_rule, only: [:show, :edit, :update, :destroy]

  def index
    @rules = WaitingListRule.order(active: :desc, priority: :asc).all
  end

  def show; end

  def new
    @rule = WaitingListRule.new(
      release_minutes_before: 60,
      max_waiting_per_slot: 5,
      confirmation_timeout_minutes: 15,
      auto_notify: true,
      notify_channel: "sms"
    )
  end

  def create
    @rule = WaitingListRule.new(rule_params)
    if @rule.save
      redirect_to @rule, notice: "候补释放规则创建成功"
    else
      render :new
    end
  end

  def edit; end

  def update
    if @rule.update(rule_params)
      redirect_to @rule, notice: "候补释放规则更新成功"
    else
      render :edit
    end
  end

  def destroy
    @rule.destroy
    redirect_to waiting_list_rules_url, notice: "规则已删除"
  end

  private

  def set_rule
    @rule = WaitingListRule.find(params[:id])
  end

  def rule_params
    params.require(:waiting_list_rule).permit(
      :name, :release_minutes_before, :max_waiting_per_slot,
      :confirmation_timeout_minutes, :auto_notify, :active,
      :description, :notify_channel, :priority, :effective_from, :effective_to
    )
  end
end
