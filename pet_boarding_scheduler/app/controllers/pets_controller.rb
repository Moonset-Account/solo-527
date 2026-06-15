class PetsController < ApplicationController
  before_action :set_pet, only: [:show]

  def index
    @q = Pet.active.ransack(params[:q])
    scope = @q.result.order(created_at: :desc)
    @pagy, @pets = pagy(scope, page: params[:page], items: 12)
  end

  def show
    @health_records = @pet.health_records.order(recorded_at: :desc).limit(10)
    @training_records = @pet.training_records.order(training_date: :desc).limit(10)
    @current_reservation = @pet.current_reservation
    @health_trend = calculate_health_trend
  end

  def new
    @pet = Pet.new
  end

  def create
    @pet = Pet.new(pet_params)

    respond_to do |format|
      if @pet.save
        Notification.create_for_notifiable(
          @pet,
          "新宠物档案：#{@pet.name}",
          "主人：#{@pet.owner_name}（#{@pet.owner_phone}），请及时安排寄养服务。",
          "reservation"
        )
        broadcast_notification

        format.turbo_stream
        format.html { redirect_to @pet, notice: "宠物档案创建成功！" }
      else
        format.turbo_stream { render :new, status: :unprocessable_entity }
        format.html { render :new, status: :unprocessable_entity }
      end
    end
  end

  private

  def set_pet
    @pet = Pet.find(params[:id])
  end

  def pet_params
    params.require(:pet).permit(
      :name, :species, :breed, :age, :weight, :gender,
      :owner_name, :owner_phone, :owner_email,
      :medical_notes, :allergies, :special_needs,
      :avatar_url
    )
  end

  def calculate_health_trend
    records = @pet.health_records.order(recorded_at: :desc).limit(7)
    return [] unless records.any?

    records.map do |r|
      score = 0
      score += r.appetite_level if r.appetite_level
      score += r.activity_level if r.activity_level
      avg = score > 0 ? (score / 2.0) : nil
      {
        date: r.recorded_at.strftime("%m-%d"),
        score: avg,
        label: r.health_status
      }
    end.reverse
  end

  def broadcast_notification
    notification = Notification.order(created_at: :desc).first
    return unless notification

    Turbo::StreamsChannel.broadcast_prepend_to(
      "notifications",
      target: "notifications-list",
      partial: "admin/notifications/notification_item",
      locals: { notification: }
    )
  end
end
