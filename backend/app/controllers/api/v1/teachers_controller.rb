module Api
  module V1
    class TeachersController < ApplicationController
      def index
        teachers = Teacher.active.order(created_at: :desc)
        render json: paginate(teachers)
      end

      def show
        teacher = Teacher.find(params[:id])
        render json: teacher, include: [:courses]
      end
    end
  end
end
