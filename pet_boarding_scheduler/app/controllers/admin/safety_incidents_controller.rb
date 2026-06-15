module Admin
  class SafetyIncidentsController < ApplicationController
    before_action :set_safety_incident, only: [:show, :edit, :update, :destroy, :resolve]

    def index
      @q = SafetyIncident.ransack(params[:q])
      scope = @q.result.includes(:pet, :caretaker, :kennel).order(occurred_at: :desc)
      @pagy, @safety_incidents = pagy(scope, page: params[:page])
    end

    def show; end

    def new
      @safety_incident = SafetyIncident.new(occurred_at: Time.current)
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @kennels = Kennel.all.order(:name)
    end

    def edit
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @kennels = Kennel.all.order(:name)
    end

    def create
      @safety_incident = SafetyIncident.new(safety_incident_params)
      if @safety_incident.save
        Notification.create_for_notifiable(
          @safety_incident,
          "安全事件：#{@safety_incident.incident_type}",
          "严重程度：#{@safety_incident.severity_label}",
          "safety"
        )
        redirect_to [:admin, @safety_incident], notice: "安全事件记录创建成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @kennels = Kennel.all.order(:name)
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @safety_incident.update(safety_incident_params)
        redirect_to [:admin, @safety_incident], notice: "安全事件记录更新成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @kennels = Kennel.all.order(:name)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      @safety_incident.destroy
      redirect_to admin_safety_incidents_url, notice: "安全事件记录已删除。"
    end

    def resolve
      if @safety_incident.update(resolved_at: Time.current, action_taken: params[:action_taken])
        redirect_to [:admin, @safety_incident], notice: "事件已标记为已解决。"
      else
        redirect_to [:admin, @safety_incident], alert: "操作失败。"
      end
    end

    private

    def set_safety_incident
      @safety_incident = SafetyIncident.find(params[:id])
    end

    def safety_incident_params
      params.require(:safety_incident).permit(
        :pet_id, :caretaker_id, :kennel_id,
        :incident_type, :severity, :description,
        :action_taken, :occurred_at, :resolved_at
      )
    end
  end
end
