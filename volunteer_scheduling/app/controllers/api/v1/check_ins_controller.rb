class Api::V1::CheckInsController < ApplicationController
  skip_before_action :verify_authenticity_token
  before_action :authenticate_api_user!

  def scan
    assignment = Assignment.find(params[:assignment_id])
    authorize assignment.check_ins.new

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
          checked_in_at: check_in.checked_in_at
        }
      }, status: :created
    rescue => e
      render json: { success: false, error: e.message }, status: :unprocessable_entity
    end
  end

  private

  def authenticate_api_user!
    token = request.headers["Authorization"]&.split(" ")&.last
    unless token && User.exists?(api_token: token)
      render json: { success: false, error: "未授权访问" }, status: :unauthorized
    end
  end
end
