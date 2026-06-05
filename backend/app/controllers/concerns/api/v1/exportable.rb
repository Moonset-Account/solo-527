module Api::V1::Exportable
  extend ActiveSupport::Concern

  def export_to_csv(collection, filename, columns)
    require 'csv'

    csv_data = CSV.generate(headers: true) do |csv|
      csv << columns.map { |c| c[:label] }
      collection.each do |record|
        csv << columns.map do |col|
          value = col[:value].is_a?(Proc) ? col[:value].call(record) : record.send(col[:value])
          value.to_s
        end
      end
    end

    send_data csv_data,
      type: 'text/csv; charset=utf-8',
      disposition: "attachment; filename=\"#{filename}_#{Time.current.strftime('%Y%m%d%H%M%S')}.csv\""
  end

  def export_to_excel(collection, filename, columns)
    require 'csv'
    export_to_csv(collection, filename, columns)
  end
end
