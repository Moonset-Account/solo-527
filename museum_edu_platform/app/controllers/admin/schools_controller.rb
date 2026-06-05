module Admin
  class SchoolsController < BaseController
    before_action :set_school, only: [:show, :edit, :update, :destroy]

    def index
      @schools = policy_scope(School).order(:name)
      @schools = @schools.by_name(params[:name]) if params[:name].present?
    end

    def show
      @students = @school.students.active_students.order(:name)
    end

    def new
      @school = School.new
      authorize @school
    end

    def edit
    end

    def create
      @school = School.new(school_params)
      authorize @school

      if @school.save
        redirect_to admin_school_path(@school), notice: '学校创建成功'
      else
        render :new
      end
    end

    def update
      if @school.update(school_params)
        redirect_to admin_school_path(@school), notice: '学校更新成功'
      else
        render :edit
      end
    end

    def destroy
      @school.destroy
      redirect_to admin_schools_path, notice: '学校已删除'
    end

    private

    def set_school
      @school = School.find(params[:id])
      authorize @school
    end

    def school_params
      params.require(:school).permit(:name, :contact_person, :phone, :email, :address, :status, :notes)
    end
  end
end
