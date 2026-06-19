class OverdueReviewsController < ApplicationController
  before_action :set_overdue_review, only: [:show, :update]
  before_action :set_visit_record, only: [:new, :create]

  def new
    @overdue_review = OverdueReview.new
  end

  def create
    @overdue_review = OverdueReview.new(overdue_review_params)
    @overdue_review.visit_record = @visit_record
    @overdue_review.reviewer = current_user
    @overdue_review.review_date = Date.current
    if @overdue_review.save
      redirect_to @visit_record, notice: "Overdue review was successfully created."
    else
      redirect_to @visit_record, alert: "Failed to create overdue review."
    end
  end

  def show
    @visit_record = @overdue_review.visit_record
  end

  def update
    if @overdue_review.update(overdue_review_params)
      redirect_to @overdue_review, notice: "Overdue review was successfully updated."
    else
      render :show, status: :unprocessable_entity
    end
  end

  private

  def set_overdue_review
    @overdue_review = OverdueReview.find(params[:id])
  end

  def set_visit_record
    @visit_record = VisitRecord.find(params[:visit_record_id])
  end

  def overdue_review_params
    params.require(:overdue_review).permit(:impact_scope, :responsible_person, :conclusion, :volunteer_service_id)
  end
end
