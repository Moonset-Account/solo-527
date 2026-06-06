module Api
  module V1
    class StudentsController < ApplicationController
      before_action :authenticate_user!

      def index
        authorize User
        students = User.where(role: 'student')
        students = students.where('name LIKE ?', "%#{params[:keyword]}%") if params[:keyword].present?
        students = students.order(created_at: :desc)

        render json: paginate(students)
      end

      def show
        student = User.find(params[:id])
        authorize student
        render json: student
      end
    end
  end
end
