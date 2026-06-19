class Admin::VehiclesController < Admin::BaseController
  def index
    @q = policy_scope(Vehicle).ransack(params[:q])
    @vehicles = @q.result.includes(:current_driver).order(created_at: :desc).page(params[:page]).per(20)
    authorize @vehicles
  end

  def show
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle
  end

  def new
    @vehicle = Vehicle.new
    authorize @vehicle
  end

  def create
    @vehicle = Vehicle.new(vehicle_params)
    authorize @vehicle

    if @vehicle.save
      OperationLog.log(current_user, 'create_vehicle', @vehicle)
      redirect_to [:admin, @vehicle], notice: '车辆创建成功。'
    else
      render :new
    end
  end

  def edit
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle
  end

  def update
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle

    if @vehicle.update(vehicle_params)
      OperationLog.log(current_user, 'update_vehicle', @vehicle)
      redirect_to [:admin, @vehicle], notice: '车辆更新成功。'
    else
      render :edit
    end
  end

  def destroy
    @vehicle = Vehicle.find(params[:id])
    authorize @vehicle

    @vehicle.destroy
    OperationLog.log(current_user, 'destroy_vehicle', @vehicle)
    redirect_to admin_vehicles_path, notice: '车辆已删除。'
  end

  private

  def vehicle_params
    params.require(:vehicle).permit(:plate_number, :vehicle_type, :status, :current_driver_id,
                                    :min_temperature, :max_temperature, :last_temperature,
                                    :last_location_lat, :last_location_lng, :last_location_at)
  end
end
