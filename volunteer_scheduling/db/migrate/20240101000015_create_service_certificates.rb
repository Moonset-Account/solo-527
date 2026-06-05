class CreateServiceCertificates < ActiveRecord::Migration[8.0]
  def change
    create_table :service_certificates do |t|
      t.references :volunteer_profile, null: false, foreign_key: true
      t.string :certificate_number, null: false
      t.datetime :issued_at, null: false
      t.float :total_hours, null: false
      t.date :start_date, null: false
      t.date :end_date, null: false
      t.integer :status, default: 0
      t.references :issued_by, foreign_key: { to_table: :users }
      t.string :qr_code_token
      t.boolean :downloaded, default: false
      t.datetime :downloaded_at

      t.timestamps
    end

    add_index :service_certificates, :certificate_number, unique: true
    add_index :service_certificates, :qr_code_token, unique: true
    add_index :service_certificates, [:volunteer_profile_id, :start_date, :end_date], unique: true, name: 'index_certs_on_volunteer_and_date_range'
  end
end
