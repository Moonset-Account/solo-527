module Api
  module V1
    class ExportsController < BaseController
      before_action :set_export, only: %i[show download]

      def index
        @exports = policy_scope(Export).by_user(current_user)
                                      .recent
                                      .page(params[:page])
                                      .per(params[:per_page] || 20)
        render_paginated @exports
      end

      def show
        authorize @export
        render json: @export.as_json(methods: [:download_url])
      end

      def create
        authorize :export, :create?
        
        export_params = export_create_params
        export_type = export_params[:type] || export_params[:export_type]
        filters = export_params[:filters] || export_params.except(:type, :export_type).to_h
        
        @export = Export.new(
          user: current_user,
          export_type: export_type,
          filters: filters.to_hash.deep_symbolize_keys
        )

        if @export.save
          ExportJob.perform_later(@export.id)
          render json: {
            message: '导出任务已开始，完成后将可下载',
            export: @export.as_json(methods: [:download_url])
          }, status: :created
        else
          render json: { errors: @export.errors.full_messages }, status: :unprocessable_entity
        end
      end

      def download
        authorize @export
        
        unless @export.completed? && @export.file_path.present? && File.exist?(@export.file_path)
          return render json: { error: '文件不存在或未生成' }, status: :not_found
        end

        send_file @export.file_path,
                  filename: @export.filename,
                  type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                  disposition: 'attachment'
      end

      private

      def set_export
        @export = Export.find(params[:id])
      end

      def export_create_params
        params.permit(:type, :export_type, filters: {}).to_h
      end
    end
  end
end
