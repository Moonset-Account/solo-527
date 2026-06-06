from app import create_app
from models import db, Order, OrderItem, Product, User, Building
from utils.helpers import generate_order_no

app = create_app()
with app.app_context():
    user = User.query.filter_by(phone='13900139000').first()
    if not user:
        user = User.query.first()
    
    building = Building.query.first()
    products = Product.query.filter_by(is_active=True).limit(2).all()
    
    print(f'User: {user.id}, {user.name}')
    print(f'Building: {building.id}, {building.name}')
    print(f'Products: {[(p.id, p.name, p.price) for p in products]}')
    
    order = Order(
        order_no=generate_order_no(),
        user_id=user.id,
        building_id=building.id,
        room_number='101',
        status='sorted',
        is_cutoff=True
    )
    
    total = 0
    for p in products:
        qty = 2
        subtotal = float(p.price) * qty
        total += subtotal
        item = OrderItem(
            product_id=p.id,
            product_name=p.name,
            unit=p.unit,
            price=p.price,
            quantity=qty,
            subtotal=subtotal
        )
        order.items.append(item)
    
    order.total_amount = total
    db.session.add(order)
    db.session.commit()
    
    print(f'\n✅ 订单创建成功')
    print(f'   订单号: {order.order_no}')
    print(f'   订单ID: {order.id}')
    print(f'   状态: {order.status}')
    print(f'   金额: {order.total_amount}')
    print(f'   商品数: {len(order.items)}')
