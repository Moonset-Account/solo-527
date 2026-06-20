class DepartmentsController < ApplicationController
  before_action :set_department, only: [:show, :edit, :update, :destroy]

  def index
    @departments = policy_scope(Department).ordered.page(params[:page]).per(20)
  end

  def show
    authorize @department
    @users = @department.users.ordered
    @tickets = @department.tickets.recent.page(params[:page]).per(20)
  end

  def new
    @department = Department.new
    authorize @department
  end

  def edit
    authorize @department
  end

  def create
    @department = Department.new(department_params)
    authorize @department

    if @department.save
      redirect_to @department, notice: '部门创建成功。'
    else
      render :new, status: :unprocessable_entity
    end
  end

  def update
    authorize @department
    if @department.update(department_params)
      redirect_to @department, notice: '部门更新成功。'
    else
      render :edit, status: :unprocessable_entity
    end
  end

  def destroy
    authorize @department
    @department.destroy
    redirect_to departments_url, notice: '部门已删除。'
  end

  private

  def set_department
    @department = Department.find(params[:id])
  end

  def department_params
    params.require(:department).permit(:name, :description)
  end
end
