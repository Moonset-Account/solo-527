module Api
  module V1
    class DashboardController < ApplicationController
      before_action :authenticate_user!
      before_action :authorize_admin!

      def overview
        start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        end_date = params[:end_date]&.to_date || Date.current

        enrollments = Enrollment.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
        works = Work.where(created_at: start_date.beginning_of_day..end_date.end_of_day)
        users = User.where(role: 'student', created_at: start_date.beginning_of_day..end_date.end_of_day)

        total_revenue = enrollments.where(status: %w[paid completed]).sum(:total_amount)

        render json: {
          today_enrollments: Enrollment.where('DATE(created_at) = ?', Date.current).count,
          total_revenue: total_revenue,
          total_works: works.count,
          new_students: users.count,
          low_stock_materials: MaterialKit.low_stock.count,
          pending_works: Work.where(review_status: 'pending').count
        }
      end

      def enrollment_trends
        start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        end_date = params[:end_date]&.to_date || Date.current

        daily_data = Enrollment
          .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
          .group('DATE(created_at)')
          .count

        daily_revenue = Enrollment
          .where(status: %w[paid completed], created_at: start_date.beginning_of_day..end_date.end_of_day)
          .group('DATE(created_at)')
          .sum(:total_amount)

        render json: {
          daily_enrollments: daily_data,
          daily_revenue: daily_revenue
        }
      end

      def status_stats
        start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        end_date = params[:end_date]&.to_date || Date.current

        enrollments = Enrollment.where(created_at: start_date.beginning_of_day..end_date.end_of_day)

        render json: {
          enrollments_by_status: enrollments.group(:status).count,
          works_by_status: Work.group(:review_status).count,
          materials_by_status: MaterialKit.group(:status).count
        }
      end

      def resource_utilization
        start_date = params[:start_date]&.to_date || 30.days.ago.to_date
        end_date = params[:end_date]&.to_date || Date.current

        teacher_stats = Teacher.includes(:courses).map do |teacher|
          course_count = teacher.courses.published.count
          enrollment_count = Enrollment
            .joins(:course)
            .where(courses: { teacher_id: teacher.id })
            .where(created_at: start_date.beginning_of_day..end_date.end_of_day)
            .count
          {
            id: teacher.id,
            name: teacher.name,
            course_count: course_count,
            enrollment_count: enrollment_count
          }
        end

        render json: {
          teacher_utilization: teacher_stats,
          low_stock_materials: MaterialKit.low_stock.select(:id, :name, :stock, :warning_threshold),
          material_stock_trend: []
        }
      end

      private

      def authorize_admin!
        render json: { error: 'Unauthorized' }, status: :forbidden unless current_user.admin?
      end
    end
  end
end
