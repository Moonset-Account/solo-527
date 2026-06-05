class Api::V1::MaterialPackagesController < Api::V1::BaseController
  def index
    authorize MaterialPackage
    packages = MaterialPackage.all
    packages = packages.available if params[:available].present?
    packages = packages.low_stock_items if params[:low_stock].present?
    packages = packages.page(params[:page]).per(params[:per_page] || 20)

    render json: {
      material_packages: packages,
      meta: pagination_meta(packages)
    }, status: :ok
  end

  def show
    @package = MaterialPackage.find(params[:id])
    authorize @package
    render json: @package, status: :ok
  end

  def create
    authorize MaterialPackage
    @package = MaterialPackage.new(material_params)
    if @package.save
      render json: @package, status: :created
    else
      render json: { error: @package.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def update
    @package = MaterialPackage.find(params[:id])
    authorize @package
    if @package.update(material_params)
      render json: @package, status: :ok
    else
      render json: { error: @package.errors.full_messages }, status: :unprocessable_entity
    end
  end

  def stock_in
    @package = MaterialPackage.find(params[:id])
    authorize @package, :stock_in?
    quantity = params[:quantity].to_i
    return render json: { error: '入库数量必须大于0' }, status: :unprocessable_entity if quantity <= 0

    @package.increment!(:stock_quantity, quantity)
    render json: @package, status: :ok
  end

  def stock_out
    @package = MaterialPackage.find(params[:id])
    authorize @package, :stock_out?
    quantity = params[:quantity].to_i
    return render json: { error: '出库数量必须大于0' }, status: :unprocessable_entity if quantity <= 0
    return render json: { error: '库存不足' }, status: :unprocessable_entity if @package.stock_quantity < quantity

    @package.decrement!(:stock_quantity, quantity)
    render json: @package, status: :ok
  end

  def export
    authorize MaterialPackage
    packages = MaterialPackage.all

    columns = [
      { label: 'SKU', value: :sku },
      { label: '名称', value: :name },
      { label: '成本价', value: :cost_price },
      { label: '售价', value: :sale_price },
      { label: '库存数量', value: :stock_quantity },
      { label: '预留数量', value: :reserved_quantity },
      { label: '可用数量', value: :available_quantity },
      { label: '安全库存', value: :safety_stock },
      { label: '状态', value: ->(p) { I18n.t("enums.material_package.status.#{p.status}") } },
      { label: '创建时间', value: ->(p) { p.created_at.strftime('%Y-%m-%d %H:%M:%S') } }
    ]

    export_to_csv(packages, '材料库存', columns)
  end

  private

  def material_params
    params.permit(:name, :sku, :description, :image_url, :cost_price, :sale_price, :stock_quantity, :safety_stock, :status, materials: [])
  end

  def pagination_meta(collection)
    {
      current_page: collection.current_page,
      total_pages: collection.total_pages,
      total_count: collection.total_count,
      per_page: collection.limit_value
    }
  end
end
