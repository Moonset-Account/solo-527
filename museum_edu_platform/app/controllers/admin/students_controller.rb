module Admin
  class StudentsController < BaseController
    before_action :set_student, only: [:show, :edit, :update, :destroy]

    def index
      @students = policy_scope(Student).includes(:school)
        .order(:name).page(params[:page]).per(30)
      @students = @students.by_school(params[:school_id]) if params[:school_id].present?
      @students = @students.by_age_group(params[:age_group]) if params[:age_group].present?
    end

    def show
    end

    def new
      @student = Student.new
      @student.school_id = params[:school_id] if params[:school_id].present?
      @schools = School.active_schools.order(:name)
      authorize @student
    end

    def edit
      @schools = School.active_schools.order(:name)
    end

    def create
      @student = Student.new(student_params)
      authorize @student

      if @student.save
        redirect_to admin_student_path(@student), notice: '学生添加成功'
      else
        @schools = School.active_schools.order(:name)
        render :new
      end
    end

    def update
      if @student.update(student_params)
        redirect_to admin_student_path(@student), notice: '学生信息更新成功'
      else
        @schools = School.active_schools.order(:name)
        render :edit
      end
    end

    def destroy
      @student.destroy
      redirect_to admin_students_path, notice: '学生已删除'
    end

    private

    def set_student
      @student = Student.find(params[:id])
      authorize @student
    end

    def student_params
      params.require(:student).permit(:school_id, :name, :gender, :age_group, :status)
    end
  end
end
