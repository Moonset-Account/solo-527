module Admin
  class BoardingReservationsController < ApplicationController
    before_action :set_boarding_reservation, only: [:show, :edit, :update, :destroy, :check_in, :check_out]

    def index
      @q = BoardingReservation.ransack(params[:q])
      scope = @q.result.includes(:pet, :caretaker, :kennel).order(check_in_at: :desc)
      @pagy, @boarding_reservations = pagy(scope, page: params[:page])
    end

    def show; end

    def new
      @boarding_reservation = BoardingReservation.new
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @kennels = Kennel.available.order(:name)
    end

    def edit
      @pets = Pet.active.order(:name)
      @caretakers = Caretaker.active.order(:name)
      @kennels = Kennel.all.order(:name)
    end

    def create
      @boarding_reservation = BoardingReservation.new(boarding_reservation_params)
      if @boarding_reservation.save
        update_kennel_status(@boarding_reservation)
        redirect_to [:admin, @boarding_reservation], notice: "寄养预约创建成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @kennels = Kennel.available.order(:name)
        render :new, status: :unprocessable_entity
      end
    end

    def update
      if @boarding_reservation.update(boarding_reservation_params)
        update_kennel_status(@boarding_reservation)
        redirect_to [:admin, @boarding_reservation], notice: "寄养预约更新成功！"
      else
        @pets = Pet.active.order(:name)
        @caretakers = Caretaker.active.order(:name)
        @kennels = Kennel.all.order(:name)
        render :edit, status: :unprocessable_entity
      end
    end

    def destroy
      kennel = @boarding_reservation.kennel
      @boarding_reservation.destroy
      kennel&.available! if BoardingReservation.where(kennel:, status: :checked_in).none?
      redirect_to admin_boarding_reservations_url, notice: "寄养预约已取消。"
    end

    def check_in
      if @boarding_reservation.update(status: :checked_in, check_in_at: Time.current)
        @boarding_reservation.kennel&.occupied!
        redirect_to [:admin, @boarding_reservation], notice: "宠物已入住！"
      else
        redirect_to [:admin, @boarding_reservation], alert: "入住失败。"
      end
    end

    def check_out
      if @boarding_reservation.update(status: :completed, check_out_at: Time.current)
        @boarding_reservation.kennel&.available!
        redirect_to [:admin, @boarding_reservation], notice: "宠物已离店！"
      else
        redirect_to [:admin, @boarding_reservation], alert: "离店失败。"
      end
    end

    def export
      ExportJob.perform_async("boarding", params.to_unsafe_h)
      redirect_to admin_boarding_reservations_path, notice: "导出任务已提交，请稍后查看。"
    end

    private

    def set_boarding_reservation
      @boarding_reservation = BoardingReservation.find(params[:id])
    end

    def boarding_reservation_params
      params.require(:boarding_reservation).permit(
        :pet_id, :caretaker_id, :kennel_id,
        :check_in_at, :check_out_at, :status,
        :total_price, :notes, :special_requests
      )
    end

    def update_kennel_status(reservation)
      return unless reservation.kennel

      if reservation.checked_in?
        reservation.kennel.occupied!
      elsif reservation.completed? || reservation.cancelled?
        reservation.kennel.available! if BoardingReservation.where(kennel: reservation.kennel, status: :checked_in).where.not(id: reservation.id).none?
      end
    end
  end
end
