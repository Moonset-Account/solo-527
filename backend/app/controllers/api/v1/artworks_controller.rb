class Api::V1::ArtworksController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:index, :show]

  def index
    authorize Artwork
    artworks = policy_scope(Artwork)
    artworks = artworks.by_student(params[:student_id]) if params[:student_id].present?
    artworks = artworks.by_course(params[:course_id]) if params[:course_id].present?
    artworks = artworks.where(is_public: params[:is_public]) if params[:is_public].present?
    artworks = artworks.where(status: params[:status]) if params[:status].present?
    artworks = artworks.order_by_likes if params[:sort] == 'popular'
    artworks = artworks.order_by_newest if params[:sort].blank? || params[:sort] == 'newest'
    artworks = artworks.page(params[:page]).per(params[:per_page] || 12)

    render json: {
      artworks: artworks.as_json(
        include: {
          student: {
            include: { user: { only: [:id, :name, :avatar_url] } },
            only: [:id]
          },
          course_session: {
            include: {
              course: { only: [:id, :title] }
            },
            only: [:id, :start_time]
          }
        }
      ),
      meta: pagination_meta(artworks)
    }, status: :ok
  end

  def show
    @artwork = Artwork.find(params[:id])
    authorize @artwork
    @artwork.increment_views! if @artwork.is_public?
    render json: @artwork.as_json(
      include: {
        student: {
          include: { user: { only: [:id, :name, :avatar_url] } },
          only: [:id]
        },
        course_session: {
          include: {
            course: { only: [:id, :title] }
          },
          only: [:id, :start_time]
        },
        teacher: {
          include: { user: { only: [:id, :name] } },
          only: [:id]
        }
      }
    ), status: :ok
  end

  def create
    authorize Artwork
    result = Artworks::CreateService.new(
      artwork_params,
      current_user,
      { ip_address: request.remote_ip, user_agent: request.user_agent }
    ).call
    service_result(result)
  end

  def update
    @artwork = Artwork.find(params[:id])
    authorize @artwork
    if @artwork.update(artwork_params)
      render json: @artwork, status: :ok
    else
      render json: { error: @artwork.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def destroy
    @artwork = Artwork.find(params[:id])
    authorize @artwork
    @artwork.destroy
    head :no_content
  end

  def approve
    @artwork = Artwork.find(params[:id])
    authorize @artwork, :approve?
    @artwork.update!(status: :published, published_at: Time.current)

    Notification.send_notification!(
      @artwork.student.user,
      '作品已通过审核',
      "您的作品《#{@artwork.title}》已通过审核并公开展示",
      'artwork_approved',
      artwork_id: @artwork.id
    )

    render json: @artwork, status: :ok
  end

  def reject
    @artwork = Artwork.find(params[:id])
    authorize @artwork, :reject?
    @artwork.update!(status: :rejected)

    Notification.send_notification!(
      @artwork.student.user,
      '作品未通过审核',
      "您的作品《#{@artwork.title}》未通过审核，原因：#{params[:reason] || '不符合展示要求'}",
      'artwork_rejected',
      artwork_id: @artwork.id
    )

    render json: @artwork, status: :ok
  end

  def like
    @artwork = Artwork.find(params[:id])
    @artwork.toggle_like!
    render json: { likes_count: @artwork.likes_count }, status: :ok
  end

  def increment_view
    @artwork = Artwork.find(params[:id])
    @artwork.increment_views! if @artwork.is_public?
    render json: { views_count: @artwork.views_count }, status: :ok
  end

  private

  def artwork_params
    params.permit(:title, :description, :thumbnail_url, :course_session_id, :teacher_id, :is_public, image_urls: [], tags: [])
  end
end
