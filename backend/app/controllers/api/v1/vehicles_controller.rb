module Api
  module V1
    class VehiclesController < ApplicationController
      def index
        scope = Vehicle.all
        scope = scope.where(blacklisted: params[:blacklisted]) if params[:blacklisted].present?
        scope = scope.ransack(params[:q]).result if params[:q].present?
        scope = scope.order(created_at: :desc)
        render_paginated(scope)
      end

      def show
        vehicle = Vehicle.find(params[:id])
        render json: vehicle
      end

      def create
        authorize_manage!
        vehicle = Vehicle.new(vehicle_params)
        if vehicle.save
          render json: vehicle, status: :created
        else
          render json: { error: vehicle.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        authorize_manage!
        vehicle = Vehicle.find(params[:id])
        if vehicle.update(vehicle_params)
          render json: vehicle
        else
          render json: { error: vehicle.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def blacklist
        authorize_manage!
        vehicle = Vehicle.find(params[:id])
        vehicle.add_to_blacklist!(params[:reason])
        render json: { message: '已加入黑名单', vehicle: vehicle }
      end

      private

      def vehicle_params
        params.permit(:plate_number, :vehicle_type, :color, :brand_model, :insurance_number, :insurance_expiry, :license_number, :license_expiry, :remark)
      end
    end
  end
end
