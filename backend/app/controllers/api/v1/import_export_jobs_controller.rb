module Api
  module V1
    class ImportExportJobsController < ApplicationController
      def index
        scope = current_user.import_export_jobs.recent
        render_paginated(scope)
      end

      def show
        job = current_user.import_export_jobs.find(params[:id])
        render json: job
      end

      def create_export
        job_type = params[:job_type]
        allowed_types = %w[export_people export_passes export_violations export_gate_logs]

        unless allowed_types.include?(job_type)
          return render json: { error: '不支持的导出类型' }, status: :unprocessable_entity
        end

        job = current_user.import_export_jobs.create!(
          job_type: job_type,
          status: 'pending',
          params: params[:filters]&.to_json
        )

        ExportJob.perform_later(job)

        render json: { message: '导出任务已创建', job: job }, status: :created
      end

      def create_import
        job_type = params[:job_type]
        allowed_types = %w[import_people import_passes]

        unless allowed_types.include?(job_type)
          return render json: { error: '不支持的导入类型' }, status: :unprocessable_entity
        end

        unless params[:file].present?
          return render json: { error: '请上传文件' }, status: :unprocessable_entity
        end

        file_path = save_uploaded_file(params[:file])

        job = current_user.import_export_jobs.create!(
          job_type: job_type,
          status: 'pending',
          file_name: params[:file].original_filename,
          file_url: file_path
        )

        ImportJob.perform_later(job)

        render json: { message: '导入任务已创建', job: job }, status: :created
      end

      def download
        job = current_user.import_export_jobs.find(params[:id])

        unless job.completed? && job.file_url.present?
          return render json: { error: '文件不可用' }, status: :unprocessable_entity
        end

        if File.exist?(job.file_url)
          send_file job.file_url
        else
          render json: { error: '文件不存在' }, status: :not_found
        end
      end

      private

      def save_uploaded_file(file)
        dir = Rails.root.join('storage', 'imports')
        FileUtils.mkdir_p(dir) unless Dir.exist?(dir)
        file_path = dir.join("#{Time.current.to_i}_#{file.original_filename}")
        File.open(file_path, 'wb') do |f|
          f.write(file.read)
        end
        file_path.to_s
      end
    end
  end
end
