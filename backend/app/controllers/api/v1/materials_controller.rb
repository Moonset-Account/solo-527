module Api
  module V1
    class MaterialsController < ApplicationController
      before_action :authenticate_user!, only: [:create, :update, :restock, :deduct_stock]
      before_action :set_material, only: [:show, :update, :restock, :deduct_stock]

      def index
        materials = MaterialKit.all
        materials = materials.active if params[:active] == 'true'
        materials = materials.low_stock if params[:low_stock] == 'true'
        materials = materials.order(created_at: :desc)

        render json: paginate(materials)
      end

      def show
        render json: @material
      end

      def create
        authorize MaterialKit
        @material = MaterialKit.new(material_params)
        if @material.save
          render json: @material, status: :created
        else
          render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def update
        authorize @material
        if @material.update(material_params)
          render json: @material
        else
          render json: { errors: @material.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def restock
        authorize @material, :restock?
        quantity = params[:quantity].to_i
        if quantity <= 0
          return render json: { error: '数量必须大于0' }, status: :unprocessable_entity
        end

        @material.restock!(quantity)
        render json: @material
      end

      def deduct_stock
        authorize @material, :deduct_stock?
        quantity = params[:quantity].to_i
        if quantity <= 0
          return render json: { error: '数量必须大于0' }, status: :unprocessable_entity
        end
        unless @material.sufficient_stock?(quantity)
          return render json: { error: '库存不足', code: 'INSUFFICIENT_STOCK' }, status: :unprocessable_entity
        end

        @material.deduct_stock!(quantity)
        render json: @material
      end

      private

      def set_material
        @material = MaterialKit.find(params[:id])
      end

      def material_params
        params.require(:material).permit(
          :name, :description, :cover_image, :stock,
          :warning_threshold, :unit_price, :status
        )
      end
    end
  end
end
