class ReviewConclusionsController < ApplicationController
  before_action :set_review_conclusion, only: [:show, :edit, :update, :destroy]
  before_action :set_ticket, only: [:new, :create]

  def index
    @q = policy_scope(ReviewConclusion).ransack(params[:q])
    @review_conclusions = @q.result.includes(:ticket, :reviewer, ticket: :department).recent.page(params[:page]).per(20)
  end

  def show
    authorize @review_conclusion
    @versions = @review_conclusion.versions.reorder(created_at: :desc)
  end

  def new
    @review_conclusion = @ticket.build_review_conclusion
    @review_conclusion.reviewer = current_user
    authorize @review_conclusion
  end

  def edit
    authorize @review_conclusion
  end

  def create
    @review_conclusion = @ticket.build_review_conclusion(review_conclusion_params)
    @review_conclusion.reviewer = current_user
    @review_conclusion.reviewed_at ||= Time.current
    authorize @review_conclusion

    if @review_conclusion.save
      @ticket.create_audit_log(current_user, 'create_review', nil, nil, nil, '复盘结论已创建')
      NotifyReviewJob.perform_later(@review_conclusion.id, current_user.id, 'create_review')
      redirect_to [@ticket, @review_conclusion], notice: '复盘结论创建成功。'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    authorize @review_conclusion
    if @review_conclusion.update(review_conclusion_params)
      @review_conclusion.ticket.create_audit_log(current_user, 'update_review', nil, nil, nil, '复盘结论已更新')
      NotifyReviewJob.perform_later(@review_conclusion.id, current_user.id, 'update_review')
      redirect_to @review_conclusion, notice: '复盘结论更新成功。'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @review_conclusion
    ticket = @review_conclusion.ticket
    @review_conclusion.destroy
    redirect_to ticket_path(ticket), notice: '复盘结论已删除。'
  end

  private

  def set_review_conclusion
    @review_conclusion = ReviewConclusion.find(params[:id])
  end

  def set_ticket
    @ticket = Ticket.find(params[:ticket_id])
  end

  def review_conclusion_params
    params.require(:review_conclusion).permit(:content, :root_cause, :improvement, :result, :efficiency_before, :efficiency_after, :reviewed_at)
  end
end
