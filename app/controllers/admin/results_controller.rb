module Admin
  class ResultsController < BaseController
    before_action :set_result, only: [:show, :edit, :update, :confirm, :disqualify]

    def index
      @q = Result.ransack(params[:q])
      @results = @q.result.includes(:event_registration, :schedule).order(created_at: :desc).page(params[:page]).per(20)
    end

    def show
      @versions = @result.versions.reorder(created_at: :desc).limit(10)
    end

    def new
      @result = Result.new
    end

    def create
      @result = Result.new(result_params)
      @result.operator = current_user

      if @result.save
        redirect_to [:admin, @result], notice: "成绩创建成功。"
      else
        render :new
      end
    end

    def edit
    end

    def update
      if @result.update(result_params)
        redirect_to [:admin, @result], notice: "成绩更新成功。"
      else
        render :edit
      end
    end

    def confirm
      @result.confirm!(current_user)
      redirect_to [:admin, @result], notice: "成绩已确认。"
    end

    def disqualify
      @result.disqualify!(params[:reason], current_user)
      redirect_to [:admin, @result], notice: "已取消成绩资格。"
    end

    private

    def set_result
      @result = Result.find(params[:id])
    end

    def result_params
      params.require(:result).permit(:event_registration_id, :schedule_id, :rank,
        :time_result, :score, :status, :remark)
    end
  end
end
