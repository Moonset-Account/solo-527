module Api
  module V1
    class WorkZonesController < ApplicationController
      def index
        scope = WorkZone.all
        scope = scope.active if params[:active].present? && params[:active] == 'true'
        scope = scope.dangerous if params[:dangerous].present? && params[:dangerous] == 'true'
        scope = scope.order(:code)
        render_paginated(scope)
      end

      def show
        work_zone = WorkZone.find(params[:id])
        render json: work_zone
      end

      def create
        authorize_admin!
        work_zone = WorkZone.new(work_zone_params)
        if work_zone.save
          render json: work_zone, status: :created
        else
          render json: { error: work_zone.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      def update
        authorize_admin!
        work_zone = WorkZone.find(params[:id])
        if work_zone.update(work_zone_params)
          render json: work_zone
        else
          render json: { error: work_zone.errors.full_messages.join(', ') }, status: :unprocessable_entity
        end
      end

      private

      def work_zone_params
        params.permit(:name, :code, :zone_type, :location, :description, :requires_second_approval, :max_capacity, :status, :time_restrictions, :safety_requirements)
      end
    end
  end
end
