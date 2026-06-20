class BatchJobsController < ApplicationController
  before_action :set_batch_job, only: [:show]

  def index
    @batch_jobs = current_user.batch_jobs.order(created_at: :desc).page(params[:page]).per(20)
  end

  def show
    authorize @batch_job
  end

  private

  def set_batch_job
    @batch_job = BatchJob.find(params[:id])
  end
end
