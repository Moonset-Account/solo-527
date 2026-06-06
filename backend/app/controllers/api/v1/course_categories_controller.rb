class Api::V1::CourseCategoriesController < Api::V1::BaseController
  skip_before_action :authenticate_user!, only: [:index]

  def index
    categories = CourseCategory.active.sorted
    render json: categories, status: :ok
  end

  def create
    authorize_admin!
    @category = CourseCategory.new(category_params)
    if @category.save
      render json: @category, status: :created
    else
      render json: { error: @category.errors.full_messages }, status: :unprocessable_entity
    end
  end

  private

  def category_params
    params.permit(:name, :code, :description, :icon_url, :sort_order, :is_active)
  end
end
