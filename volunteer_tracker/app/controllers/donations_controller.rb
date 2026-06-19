class DonationsController < ApplicationController
  before_action :set_donation, only: [:show, :edit, :update, :destroy, :receive, :confirm, :reject]

  def index
    @donations = Donation.includes(:material).order(created_at: :desc)
    @donations = @donations.where(status: params[:status]) if params[:status].present?
    @donations = @donations.where(donation_type: params[:donation_type]) if params[:donation_type].present?
  end

  def show
  end

  def new
    @donation = Donation.new
  end

  def create
    @donation = Donation.new(donation_params)
    if @donation.save
      redirect_to @donation, notice: "Donation was successfully created."
    else
      render :new, status: :unprocessable_entity
    end
  end

  def edit
  end

  def update
    if @donation.update(donation_params)
      redirect_to @donation, notice: "Donation was successfully updated."
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    @donation.destroy!
    redirect_to donations_url, notice: "Donation was successfully destroyed."
  end

  def receive
    @donation.receive!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("donation_#{@donation.id}", partial: "donations/donation", locals: { donation: @donation }) }
      format.html { redirect_to donations_url, notice: "Donation received." }
    end
  end

  def confirm
    @donation.confirm!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("donation_#{@donation.id}", partial: "donations/donation", locals: { donation: @donation }) }
      format.html { redirect_to donations_url, notice: "Donation confirmed." }
    end
  end

  def reject
    @donation.reject!
    respond_to do |format|
      format.turbo_stream { render turbo_stream: turbo_stream.replace("donation_#{@donation.id}", partial: "donations/donation", locals: { donation: @donation }) }
      format.html { redirect_to donations_url, notice: "Donation rejected." }
    end
  end

  private

  def set_donation
    @donation = Donation.find(params[:id])
  end

  def donation_params
    params.require(:donation).permit(:donor_name, :donor_contact, :amount, :donation_type, :material_id, :quantity, :status, :remark)
  end
end
