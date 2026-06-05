class Artworks::CreateService < ApplicationService
  def call
    return error('学员信息不存在') unless current_user.student

    result = nil

    ActiveRecord::Base.transaction do
      @artwork = Artwork.new(artwork_params)
      @artwork.student = current_user.student
      @artwork.status = params[:is_public] ? :pending_review : :draft

      if @artwork.save
        log_audit('create', @artwork, {}, @artwork.attributes)

        if @artwork.pending_review?
          User.where(role: [:admin, :super_admin]).each do |admin|
            send_notification(
              admin,
              '新作品待审核',
              "#{current_user.name} 提交了作品《#{@artwork.title}》待审核",
              'artwork_pending',
              artwork_id: @artwork.id
            )
          end
        end

        result = success(@artwork)
      else
        result = error(@artwork.errors.full_messages)
      end
    end

    result
  rescue StandardError => e
    error(e.message)
  end

  private

  def artwork_params
    params.permit(
      :title,
      :description,
      :thumbnail_url,
      :course_session_id,
      :teacher_id,
      :is_public,
      image_urls: [],
      tags: []
    )
  end
end
