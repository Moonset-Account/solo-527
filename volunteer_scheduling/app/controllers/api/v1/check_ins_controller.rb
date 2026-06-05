class Api::V1::CheckInsController < ApplicationController
  skip_before_action :verify_authenticity_token
  skip_before_action :authenticate_user!
  before_action :authenticate_by_assignment_or_token!

  def scan
    assignment = Assignment.find(params[:assignment_id])

    method = params[:check_in_method] || "qr_code"
    latitude = params[:latitude]
    longitude = params[:longitude]

    begin
      check_in = CheckIn.check_in(assignment, method, latitude, longitude)
      render json: {
        success: true,
        check_in: {
          id: check_in.id,
          status: check_in.status,
          needs_review: check_in.needs_review?,
          review_reason: check_in.review_reason,
          checked_in_at: check_in.checked_in_at,
          service_hours: check_in.service_hours,
          is_late: check_in.is_late?,
          is_proxy_suspected: check_in.is_proxy_suspected,
          requires_two_admins: check_in.requires_two_admins?
        }
      }, status: :created
    rescue => e
      render json: { success: false, error: e.message }, status: :unprocessable_entity
    end
  end

  private

  def authenticate_by_assignment_or_token!
    assignment_id = params[:assignment_id]
    scan_token = params[:scan_token] || request.headers["X-Scan-Token"]

    if assignment_id.present? && scan_token.present?
      assignment = Assignment.find_by(id: assignment_id)
      if assignment && assignment.location&.qr_token == scan_token
        return true
      end
    end

    render json: { success: false, error: "未授权访问" }, status: :unauthorized
  end
end
