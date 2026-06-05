class ServiceCertificate < ApplicationRecord
  belongs_to :volunteer_profile
  belongs_to :issued_by, class_name: "User", optional: true

  enum :status, { draft: 0, issued: 1, revoked: 2 }

  validates :certificate_number, uniqueness: true
  validates :qr_code_token, uniqueness: true
  validates :start_date, presence: true
  validates :end_date, presence: true
  validates :total_hours, presence: true, numericality: { greater_than: 0 }

  before_validation :generate_certificate_number, on: :create
  before_validation :generate_qr_code_token, on: :create
  validate :no_duplicate_certificates, on: :create

  def generate_certificate_number
    self.certificate_number ||= "VOL-#{Time.current.strftime('%Y%m%d')}-#{SecureRandom.hex(4).upcase}"
  end

  def generate_qr_code_token
    self.qr_code_token ||= SecureRandom.urlsafe_base64(32)
  end

  def no_duplicate_certificates
    existing = ServiceCertificate.where(
      volunteer_profile_id: volunteer_profile_id,
      start_date: start_date,
      end_date: end_date
    ).where.not(id: id).exists?
    if existing
      errors.add(:base, "该时间段内的服务证明已存在，不可重复开具")
    end
  end

  def self.issue_for(volunteer_profile, start_date, end_date, issued_by = nil)
    check_ins = volunteer_profile.check_ins.approved
                                 .where("checked_in_at >= ? AND checked_in_at <= ?", start_date.beginning_of_day, end_date.end_of_day)
    total_hours = check_ins.sum(:service_hours)

    if total_hours <= 0
      raise "该时间段内没有可统计的服务时长"
    end

    certificate = new(
      volunteer_profile: volunteer_profile,
      start_date: start_date,
      end_date: end_date,
      total_hours: total_hours.round(2),
      issued_at: Time.current,
      issued_by: issued_by,
      status: :issued
    )

    certificate.save!
    certificate
  end

  def generate_pdf
    require "prawn"
    require "matrix"

    pdf = Prawn::Document.new
    volunteer = volunteer_profile.user

    pdf.font_size 24
    pdf.text "志愿服务证明", align: :center
    pdf.move_down 20

    pdf.font_size 12
    pdf.text "证书编号: #{certificate_number}"
    pdf.text "开具日期: #{issued_at.strftime('%Y年%m月%d日')}"
    pdf.move_down 15

    pdf.text "兹证明 #{volunteer.name}（身份证号: ************），自 #{start_date.strftime('%Y年%m月%d日')} 至 #{end_date.strftime('%Y年%m月%d日')} 期间，累计参与志愿服务 #{total_hours} 小时。"
    pdf.move_down 15

    pdf.text "服务记录详情："
    pdf.move_down 10

    check_ins = volunteer_profile.check_ins.approved
                                 .where("checked_in_at >= ? AND checked_in_at <= ?", start_date.beginning_of_day, end_date.end_of_day)
                                 .includes(:activity)

    check_ins.each do |ci|
      pdf.text "#{ci.checked_in_at.strftime('%Y-%m-%d')} | #{ci.assignment.activity.title} | #{ci.service_hours} 小时"
    end

    pdf.move_down 30
    pdf.text "特此证明", align: :right
    pdf.move_down 20
    pdf.text "发证机构：非营利机构志愿者管理中心", align: :right

    qr_code = RQRCode::QRCode.new("https://verify.volunteer.example.com/#{qr_code_token}")
    png = qr_code.as_png(size: 100)
    temp_file = Tempfile.new(["qr_", ".png"])
    temp_file.binmode
    temp_file.write(png.to_s)
    temp_file.rewind
    pdf.image temp_file.path, at: [pdf.bounds.left + 20, pdf.bounds.bottom + 100], width: 100
    temp_file.close
    temp_file.unlink

    pdf.render
  end

  def mark_downloaded!
    update!(downloaded: true, downloaded_at: Time.current)
  end
end
