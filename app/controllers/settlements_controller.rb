class SettlementsController < ApplicationController
  def index
    @q = policy_scope(Settlement).ransack(params[:q])
    @settlements = @q.result.includes(:vehicle, :driver).order(created_at: :desc).page(params[:page]).per(20)
    authorize @settlements
  end

  def show
    @settlement = Settlement.find(params[:id])
    authorize @settlement
  end
end
