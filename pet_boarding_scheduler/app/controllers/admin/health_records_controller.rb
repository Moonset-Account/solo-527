module Admin
  class HealthRecordsController < ApplicationController
    before_action :set_health_record, only: [:show, :edit, :update, :destroy]

    def index
      @q = HealthRecord.ransack(params[:q])
      scope = @q.result.includes(:pet, :caretaker).order(recorded_at: :desc)
      @pagy, @health_records = pagy(scope, page: params[:page])
    end

    def show; end

    def new
      @health_record = HealthRecord.new(recorded_at: Time.current)
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
    end

    def edit
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
    end

    def create
      @health_record = HealthRecord.new(health_record_params)
      if @health_record.save
        check_health_alert(@health_record)
        redirect_to [:admin, @health_record], notice: "健康记录创建成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @health_record.update(health_record_params)
        redirect_to [:admin, @health_record], notice: "健康记录更新成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @health_record.destroy
      redirect_to admin_health_records_url, notice: "健康记录已删除。"
    end

    private

    def set_health_record
      @health_record = HealthRecord.find(params[:id])
    end

    def health_record_params
      params.require(:health_record).permit(
        :pet_id, :caretaker_id, :temperature, :weight,
        :appetite_level, :activity_level, :symptoms,
        :notes, :recorded_at
      )
    end

    def check_health_alert(record)
      return unless record.appetite_level && record.appetite_level <= 2

      Notification.create_for_notifiable(
        record.pet,
        "健康预警：#{record.pet.name}",
        "食欲评分低于正常水平，请关注。",
        "health"
      )
    end
  end
end
