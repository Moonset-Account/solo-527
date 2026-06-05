class Location < ApplicationRecord
  belongs_to :activity
  has_many :assignments, dependent: :destroy
  has_and_belongs_to_many :required_skills, class_name: "Skill", join_table: "location_skills"

  geocoded_by :address
  # after_validation :geocode, if: ->(obj) { obj.address.present? && obj.address_changed? }

  validates :name, presence: true
  validates :address, presence: true

  def generate_qr_code
    qr_code_data = "volunteer-checkin:#{id}:#{Time.current.to_i}"
    qrcode = RQRCode::QRCode.new(qr_code_data)
    qrcode.as_png(
      bit_depth: 1,
      border_modules: 4,
      color_mode: ChunkyPNG::COLOR_GRAYSCALE,
      color: "black",
      file: nil,
      fill: "white",
      module_px_size: 6,
      resize_exactly_to: false,
      resize_gte_to: false,
      size: 120
    )
  end
end
