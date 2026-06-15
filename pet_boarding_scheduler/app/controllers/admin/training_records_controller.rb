module Admin
  class TrainingRecordsController < ApplicationController
    before_action :set_training_record, only: [:show, :edit, :update, :destroy]

    def index
      @q = TrainingRecord.ransack(params[:q])
      scope = @q.result.includes(:pet, :caretaker, :service).order(training_date: :desc)
      @pagy, @training_records = pagy(scope, page: params[:page])
      @stats = {
        total: TrainingRecord.count,
        scheduled: TrainingRecord.scheduled.count,
        completed: TrainingRecord.completed.count,
        delayed: TrainingRecord.delayed.count
      }
    end

    def show; end

    def new
      @training_record = TrainingRecord.new(training_date: Date.today)
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @services = Service.active.where(category: "training").order(:name)
    end

    def edit
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @services = Service.active.where(category: "training").order(:name)
    end

    def create
      @training_record = TrainingRecord.new(training_record_params)
      if @training_record.save
        check_and_notify_delay(@training_record)
        redirect_to [:admin, @training_record], notice: "训练记录创建成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @services = Service.active.where(category: "training").order(:name)
        render :new, status: :unprocessable_entity
      end
    end

    def update
      was_not_delayed = !@training_record.delayed?
      if @training_record.update(training_record_params)
        check_and_notify_delay(@training_record) if @training_record.delayed? && was_not_delayed
        redirect_to [:admin, @training_record], notice: "训练记录更新成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @services = Service.active.where(category: "training").order(:name)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @training_record.destroy
      redirect_to admin_training_records_url, notice: "训练记录已删除。"
    end

    private

    def set_training_record
      @training_record = TrainingRecord.find(params[:id])
    end

    def training_record_params
      params.require(:training_record).permit(
        :pet_id, :caretaker_id, :service_id,
        :training_date, :duration_minutes, :content,
        :progress, :notes, :delay_reason, :status
      )
    end

    def check_and_notify_delay(record)
      return unless record.delayed?

      delay_text = record.delay_reason.present? ? "原因：#{record.delay_reason}" : "请及时处理"

      Notification.create_for_notifiable(
        record,
        "训练延期提醒 - #{record.pet_name}",
        "「#{record.service_name || '训练'}」原定于 #{record.training_date}，主理人：#{record.caretaker_name}。#{delay_text}",
        "training"
      )
    end
  end
end
