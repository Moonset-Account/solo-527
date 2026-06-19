class VisitRecordsController < ApplicationController
  before_action :set_visit_record, only: [:show, :edit, :update, :destroy, :start_visit, :complete, :mark_overdue]

  def index
    @q = VisitRecord.ransack(params[:q])
    @visit_records = @q.result.order(visit_date: :desc)
  end

  def show
    @overdue_review = @visit_record.overdue_review
  end

  def new
    @visit_record = VisitRecord.new
  end

  def create
    @visit_record = VisitRecord.new(visit_record_params)
    @visit_record.volunteer = current_user
    if @visit_record.save
      redirect_to @visit_record, notice: "Visit record was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @visit_record.update(visit_record_params)
      redirect_to @visit_record, notice: "Visit record was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @visit_record.destroy!
    redirect_to visit_records_url, notice: "Visit record was successfully destroyed."
  end

  def start_visit
    @visit_record.start_visit!
    redirect_to @visit_record, notice: "Visit started."
  end

  def complete
    @visit_record.complete!
    redirect_to @visit_record, notice: "Visit completed."
  end

  def mark_overdue
    @visit_record.mark_overdue!
    redirect_to @visit_record, notice: "Visit marked as overdue. Reminder created."
  end

  private

  def set_visit_record
    @visit_record = VisitRecord.find(params[:id])
  end

  def visit_record_params
    params.require(:visit_record).permit(:visit_date, :target_name, :target_address, :target_contact, :purpose, :result, :status, :next_action)
  end
end
