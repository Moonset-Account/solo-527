class CheckInsController < ApplicationController
  before_action :set_check_in, only: [:show]

  def index
    @q = policy_scope(CheckIn).ransack(params[:q])
    @check_ins = @q.result.includes(:user, :checkinable).order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @check_in
    @versions = @check_in.versions.reorder(created_at: :desc).limit(10)
  end

  private

  def set_check_in
    @check_in = CheckIn.find(params[:id])
  end
end
