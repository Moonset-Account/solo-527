class ServiceCertificatesController < ApplicationController
  before_action :set_service_certificate, only: [:show, :download, :issue, :revoke]

  def index
    @service_certificates = policy_scope(ServiceCertificate).order(created_at: :desc)
    authorize @service_certificates
  end

  def show
    authorize @service_certificate
  end

  def new
    @service_certificate = ServiceCertificate.new
    authorize @service_certificate
    if current_user.volunteer?
      @volunteer_profile = current_user.volunteer_profile
    end
  end

  def create
    if current_user.volunteer?
      volunteer_profile = current_user.volunteer_profile
    else
      volunteer_profile = VolunteerProfile.find(params[:volunteer_profile_id])
    end

    start_date = Date.parse(params[:start_date])
    end_date = Date.parse(params[:end_date])

    authorize ServiceCertificate.new

    begin
      @service_certificate = ServiceCertificate.issue_for(volunteer_profile, start_date, end_date, current_user)
      redirect_to @service_certificate, notice: "服务证明开具成功。"
    rescue => e
      flash[:alert] = "开具失败：#{e.message}"
      redirect_to new_service_certificate_path
    end
  end

  def download
    authorize @service_certificate, :download?
    pdf = @service_certificate.generate_pdf
    @service_certificate.mark_downloaded!

    send_data pdf,
      filename: "志愿服务证明-#{@service_certificate.certificate_number}.pdf",
      type: "application/pdf",
      disposition: "attachment"
  end

  def issue
    authorize @service_certificate, :issue?
    if @service_certificate.draft?
      @service_certificate.update!(status: :issued, issued_at: Time.current, issued_by: current_user)
      redirect_to @service_certificate, notice: "服务证明已签发。"
    else
      redirect_to @service_certificate, alert: "无法签发此证明。"
    end
  end

  def revoke
    authorize @service_certificate, :revoke?
    if @service_certificate.issued?
      @service_certificate.revoked!
      redirect_to @service_certificate, notice: "服务证明已撤销。"
    else
      redirect_to @service_certificate, alert: "无法撤销此证明。"
    end
  end

  private

  def set_service_certificate
    @service_certificate = ServiceCertificate.find(params[:id])
  end
end
