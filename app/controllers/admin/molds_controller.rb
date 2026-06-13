module Admin
  class MoldsController < ApplicationController
    before_action :set_mold, only: [:show, :edit, :update, :destroy]

    def index
      @q = Mold.ransack(params[:q])
      @molds = @q.result.order(created_at: :desc).page(params[:page]).per(15)
      authorize @molds, policy_class: Admin::MoldPolicy
    end

    def show
      authorize @mold, policy_class: Admin::MoldPolicy
    end

    def new
      @mold = Mold.new
      authorize @mold, policy_class: Admin::MoldPolicy
    end

    def create
      @mold = Mold.new(mold_params)
      authorize @mold, policy_class: Admin::MoldPolicy
      if @mold.save
        redirect_to admin_molds_path, notice: "模具创建成功。"
      else
        render :new
      end
    end

    def edit
      authorize @mold, policy_class: Admin::MoldPolicy
    end

    def update
      authorize @mold, policy_class: Admin::MoldPolicy
      if @mold.update(mold_params)
        redirect_to admin_molds_path, notice: "模具更新成功。"
      else
        render :edit
      end
    end

    def destroy
      authorize @mold, policy_class: Admin::MoldPolicy
      @mold.destroy
      redirect_to admin_molds_path, notice: "模具已删除。"
    end

    private

    def set_mold
      @mold = Mold.find(params[:id])
    end

    def mold_params
      params.require(:mold).permit(:code, :name, :material, :total_shots, :current_shots, :max_shots, :status, :maintenance_date)
    end
  end
end
