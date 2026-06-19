class Admin::DriverAssignmentsController < Admin::BaseController
  def index
    @q = policy_scope(DriverAssignment).ransack(params[:q])
    @driver_assignments = @q.result.includes(:vehicle, :old_driver, :new_driver, :reassigned_by).order(created_at: :desc).page(params[:page]).per(20)
    authorize @driver_assignments
  end

  def new
    @driver_assignment = DriverAssignment.new
    authorize @driver_assignment
    @vehicles = Vehicle.active
    @drivers = User.driver.active
  end

  def create
    @driver_assignment = DriverAssignment.new(driver_assignment_params)
    @driver_assignment.reassigned_by = current_user
    @driver_assignment.reassigned_at = Time.current
    authorize @driver_assignment

    if @driver_assignment.save
      vehicle = @driver_assignment.vehicle
      vehicle.update(current_driver: @driver_assignment.new_driver)
      OperationLog.log(current_user, 'assign_driver', @driver_assignment.vehicle, {
        old_driver_id: @driver_assignment.old_driver_id,
        new_driver_id: @driver_assignment.new_driver_id
      })
      redirect_to admin_driver_assignments_path, notice: '司机分配成功。'
    else
      @vehicles = Vehicle.active
      @drivers = User.driver.active
      render :new
    end
  end

  private

  def driver_assignment_params
    params.require(:driver_assignment).permit(:vehicle_id, :old_driver_id, :new_driver_id, :reason)
  end
end
