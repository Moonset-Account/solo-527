class Admin::ConsumableRulesController < ApplicationController
  layout "admin"

  before_action :set_consumable_rule, only: [:show, :edit, :update, :destroy]

  def index
    @consumable_rules = ConsumableRule.includes(:treatment).order(:name)
  end

  def show
  end

  def new
    @consumable_rule = ConsumableRule.new
    @treatments = Treatment.active_only
  end

  def create
    @consumable_rule = ConsumableRule.new(consumable_rule_params)
    if @consumable_rule.save
      redirect_to admin_consumable_rules_path, notice: "提醒规则创建成功"
    else
      @treatments = Treatment.active_only
      render :new, status: :unprocessable_content
    end
  end

  def edit
    @treatments = Treatment.active_only
  end

  def update
    if @consumable_rule.update(consumable_rule_params)
      redirect_to admin_consumable_rules_path, notice: "提醒规则更新成功"
    else
      @treatments = Treatment.active_only
      render :edit, status: :unprocessable_content
    end
  end

  def destroy
    @consumable_rule.update!(active: false)
    redirect_to admin_consumable_rules_path, notice: "提醒规则已停用"
  end

  private

  def set_consumable_rule
    @consumable_rule = ConsumableRule.find(params[:id])
  end

  def consumable_rule_params
    params.require(:consumable_rule).permit(:name, :treatment_id, :threshold_sessions, :threshold_percentage, :check_interval, :active)
  end
end
